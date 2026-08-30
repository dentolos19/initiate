"use client";

import EmojiPicker from "emoji-picker-react";
import { Edit, Mic, MicOff, MoreVertical, SendIcon, SmilePlus, Trash2, X, FileText } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import z from "zod";

import LoadingSpinner from "#/components/loading-spinner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import useBackend from "#/lib/backend/client";
import { Attachment, Message, messageSchema } from "#/lib/backend/connectors/messages";
import { RealtimeKitRoom } from "#/lib/backend/connectors/realtimekit";
import { useSession } from "#/lib/providers/session";
import { useParams, useSearchParams } from "#/lib/router";
import { CallButtons } from "#/routes/-pages/(platform)/messages/[id]/_components/call-buttons";
import { CallInterface } from "#/routes/-pages/(platform)/messages/[id]/_components/call-interface";

import { useMessagesContext } from "../layout";
import { MessageAttachment } from "./_components/message-attachment";
import { MessageUpload } from "./_components/message-upload";

const messageWrapperSchema = z.object({
  id: z.string().optional(),
  action: z.string().default("send"),
  content: z.string().optional(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        name: z.string(),
        type: z.string(),
        size: z.number().optional(),
      }),
    )
    .optional(),
  data: messageSchema.optional(),
});

export default function Page() {
  const backend = useBackend();
  const session = useSession();
  const params = useParams();
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const messagesContext = useMessagesContext();

  const id = params.id as string;
  const act = searchParams.get("act") || null;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(true);
  const [socket, setSocket] = useState<WebSocket>();

  const [chatName, setChatName] = useState<string>("Unknown Chat");
  const [chatStatus, setChatStatus] = useState<string>("Unknown Status");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showMenuForMessage, setShowMenuForMessage] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [realtimeKitRoom, setRealtimeKitRoom] = useState<RealtimeKitRoom | null>(null);

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  function handleAttachment(attachment: Attachment) {
    setAttachments((prev) => [...prev, attachment]);
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  }

  function handleStartCall(newCallType: "voice" | "video", newRealtimeKitRoom: RealtimeKitRoom) {
    setCallType(newCallType);
    setRealtimeKitRoom(newRealtimeKitRoom);
    setIsInCall(true);
  }

  function handleEndCall() {
    setIsInCall(false);
    setRealtimeKitRoom(null);
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        try {
          const asset = await backend.assets.uploadFile(audioFile);
          const attachment: Attachment = {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            fileType: "audio",
            size: asset.size,
          };
          handleAttachment(attachment);
          toast.success("Voice message recorded successfully");
        } catch (error) {
          console.error("Error uploading voice message:", error);
          toast.error("Failed to upload voice message");
        }

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
        setMediaRecorder(null);
        setRecordingDuration(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Start duration timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        setRecordingDuration(Date.now() - startTime);
      }, 100);

      // Store original onstop and add timer cleanup
      const originalOnStop = recorder.onstop;
      recorder.onstop = (event) => {
        clearInterval(timer);
        if (originalOnStop) originalOnStop.call(recorder, event);
      };
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const result = await backend.messages.getSummary(id);
      setSummary(result.summary);
      toast.success("Chat summary generated successfully");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate chat summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  function handleSubmit() {
    const content = chatInput.trim();

    if (!content && attachments.length === 0) return;

    console.log("Sending message with attachments:", attachments);

    if (socket && socket.readyState === WebSocket.OPEN) {
      if (selectedMessageId) {
        // Edit existing message
        const data = JSON.stringify({
          userId: session.user!.id,
          roomId: id,
          id: selectedMessageId,
          action: "edit",
          content,
          attachments,
        });
        console.log("Sending edit data:", data);
        socket.send(data);
        setSelectedMessageId(null);
      } else {
        // Send new message
        const data = JSON.stringify({
          userId: session.user!.id,
          roomId: id,
          action: "send",
          content,
          attachments,
        });
        console.log("Sending new message data:", data);
        socket.send(data);
      }
      setChatInput("");
      setAttachments([]);
    } else {
      toast.error("Socket is not connected.");
    }
  }

  useEffect(() => {
    backend.messages
      .getRoom(id)
      .then((room) => {
        if (act === "organization") {
          const otherUser = room.users?.[0]?.user;
          if (otherUser) {
            setChatName(`${otherUser.firstName} ${otherUser.lastName}`.trim() || "Unknown User");
            // TODO: Set chat status
          } else {
            setChatName("Unknown User");
            // TODO: Set chat status
          }
        } else {
          const userParticipants = room.users?.filter((user) => user.user.id !== session.user?.id);
          const otherUser = userParticipants?.[0]?.user;
          if (otherUser) {
            setChatName(`${otherUser.firstName} ${otherUser.lastName}`.trim() || "Unknown User");
            // TODO: Set chat status
          } else {
            const otherOrganization = room.organizations?.[0].organization;
            if (otherOrganization) {
              setChatName(otherOrganization.name || "Unknown Organization");
              // TODO: Set chat status
            }
          }
        }

        setChatMessages(room.messages || []);
      })
      .then(() => {
        const socket = backend.messages.connectRoom(id);
        setSocket(socket);

        socket.addEventListener("open", () => {
          console.log("The connection to a room is established.");
          setConnecting(false);
        });

        socket.addEventListener("close", () => {
          console.log("The connection to a room is closed.");
        });

        socket.addEventListener("error", (error) => {
          console.error("An error had occurred during socket connection.", error);
          toast.error("An error occurred with the socket connection. Please check the console for more details.");
        });

        socket.addEventListener("message", (event) => {
          const data = JSON.parse(event.data);

          const { success: errorParsed, data: errorData } = z.object({ error: z.string() }).safeParse(data);

          if (errorParsed) {
            toast.error(errorData.error);
            return;
          }

          console.log("Received message:", data);

          const { success: messageParsed, data: messageData } = messageWrapperSchema.safeParse(data);

          if (!messageParsed) {
            console.error("Message parsing failed:", messageWrapperSchema.safeParse(data).error);
            toast.error("Received an invalid message format.");
            return;
          }

          console.log("Parsed message data:", messageData);

          if (messageData.action === "send" && messageData.data) {
            console.log("Adding new message with attachments:", messageData.data.attachments);
            setChatMessages((previous) => {
              const messageExists = previous.some((msg) => msg.id === messageData.data!.id);
              if (messageExists) return previous;
              return [...previous, messageData.data!];
            });

            // Notify the layout to refresh room list
            messagesContext.updateRoomWithMessage(id, messageData.data);
          } else if (messageData.action === "edit" && messageData.data) {
            console.log("Editing message with attachments:", messageData.data.attachments);
            setChatMessages((previous) => {
              return previous.map((msg) => {
                if (msg.id === messageData.data!.id) {
                  return {
                    ...msg,
                    content: messageData.data!.content,
                    attachments: messageData.data!.attachments || [],
                    updatedAt: new Date().toISOString(),
                  };
                }
                return msg;
              });
            });

            // Notify the layout to refresh room list for edited messages too
            messagesContext.updateRoomWithMessage(id, messageData.data);
          } else if (messageData.action === "delete") {
            setChatMessages((previous) => {
              return previous.filter((msg) => msg.id !== messageData.id);
            });

            // Notify the layout to refresh room list
            messagesContext.updateRoomWithMessage(id, null);
          } else {
            toast.error("No action.");
          }
        });
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      socket?.close();
      setSocket(undefined);
    };
  }, [id, act, session.user, session.organization]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // useEffect(() => {
  //   if (!receipientId) return;
  //   backend.user
  //     .getUser(receipientId)
  //     .then((user) => {
  //       setRecipient(user);
  //       setDisplayName(`${user.firstName} ${user.lastName}`);
  //     })
  //     .catch((err) => console.error("Failed to fetch recipient profile:", err));
  // }, [receipientId]);

  const handleEditMessage = (messageId: string, currentContent: string | null | undefined) => {
    setChatInput(currentContent || "");
    setSelectedMessageId(messageId);
    console.log("Edit message:", messageId);
    setShowMenuForMessage(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const data = JSON.stringify({
        userId: session.user!.id,
        roomId: id,
        id: messageId,
        action: "delete",
      });
      socket.send(data);
    }
  };

  // Find the content of the message being edited
  const editingOriginal = selectedMessageId ? chatMessages.find((msg) => msg.id === selectedMessageId)?.content : "";

  if (loading || connecting) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={"flex size-full flex-col"}>
      {/* Header - Hidden during calls */}
      {!isInCall && (
        <header className={"bg-secondary flex h-16 items-center justify-between border-b px-4"}>
          <div>
            <div className={"font-bold"}>{chatName}</div>
            {/* <div className={"text-muted-foreground text-xs"}>Online</div> */}
          </div>
          <CallButtons roomId={id} onCallStart={handleStartCall} disabled={connecting || !socket} />
        </header>
      )}

      {/* Call Interface or Messages */}
      {isInCall && realtimeKitRoom ? (
        <div className={"flex-1"}>
          <CallInterface roomId={id} callType={callType} realtimeKitRoom={realtimeKitRoom} onCallEnd={handleEndCall} />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className={"flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto px-4 py-3"}>
            {chatMessages.map((msg) => {
              const fromMe = msg.userId === session.user?.id;
              const isActive = showMenuForMessage === msg.id;
              const hasContent = msg.content && msg.content.trim();
              const hasAttachments = msg.attachments && msg.attachments.length > 0;

              // Debug logging
              console.log("Rendering message:", msg.id, "attachments:", msg.attachments);

              return (
                <div
                  key={msg.id}
                  className={`relative flex w-full flex-col space-y-2 ${fromMe ? "items-end" : "items-start"} ${isActive ? "z-50" : ""}`}
                  onMouseEnter={() => fromMe && setHoveredMessageId(msg.id)}
                  onMouseLeave={() => {
                    setHoveredMessageId(null);
                    if (isActive) return;
                  }}
                >
                  {/* Text content bubble */}
                  {hasContent && (
                    <div
                      className={[
                        "relative w-max max-w-[500px] rounded-lg p-3 break-words whitespace-normal",
                        fromMe ? "bg-primary text-primary-foreground" : "bg-muted",
                      ].join(" ")}
                    >
                      <div>{msg.content}</div>

                      {/* Show timestamp only if there are no attachments */}
                      {!hasAttachments && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}

                      {/* Show menu button only if this is the only component (no attachments) */}
                      {fromMe && !hasAttachments && (hoveredMessageId === msg.id || isActive) && (
                        <div className="absolute top-1/2 -left-10.5 -translate-y-1/2 transform">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted h-8 w-8 p-0"
                            onClick={() => setShowMenuForMessage(isActive ? null : msg.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {isActive && (
                            <div className="bg-background border-border absolute top-full right-0 z-50 mt-1 w-40 rounded-md border shadow-lg">
                              <div className="py-1">
                                <button
                                  className="hover:bg-muted flex w-full items-center px-3 py-2 text-sm transition-colors"
                                  onClick={() => handleEditMessage(msg.id, msg.content)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit message
                                </button>
                                <button
                                  className="hover:bg-muted text-destructive flex w-full items-center px-3 py-2 text-sm transition-colors"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete message
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attachments */}
                  {hasAttachments && (
                    <div className={`space-y-2 ${fromMe ? "items-end" : "items-start"} relative flex flex-col`}>
                      {msg.attachments!.map((attachment) => (
                        <MessageAttachment key={attachment.id} attachment={attachment} />
                      ))}

                      {/* Show timestamp on attachments */}
                      <span className="text-muted-foreground text-xs">
                        {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {/* Show menu button for all messages with attachments */}
                      {fromMe && (hoveredMessageId === msg.id || isActive) && (
                        <div className="absolute top-1/2 -left-10.5 -translate-y-1/2 transform">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted h-8 w-8 p-0"
                            onClick={() => setShowMenuForMessage(isActive ? null : msg.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {isActive && (
                            <div className="bg-background border-border absolute top-full right-0 z-50 mt-1 w-40 rounded-md border shadow-lg">
                              <div className="py-1">
                                {/* Show edit option only if there's text content */}
                                {hasContent && (
                                  <button
                                    className="hover:bg-muted flex w-full items-center px-3 py-2 text-sm transition-colors"
                                    onClick={() => handleEditMessage(msg.id, msg.content)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit message
                                  </button>
                                )}
                                <button
                                  className="hover:bg-muted text-destructive flex w-full items-center px-3 py-2 text-sm transition-colors"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Scroll target */}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <footer className={"flex flex-col space-y-1 border-t px-4"}>
            {selectedMessageId && (
              <div className="flex items-center space-x-2 px-3 py-2">
                <h3 className="text-sm font-semibold">Editing message:</h3>
                <span className="text-muted-foreground flex-1 truncate text-sm">{editingOriginal}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedMessageId(null);
                    setChatInput("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="bg-muted/50 flex flex-wrap gap-2 rounded-lg p-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    <MessageAttachment attachment={attachment} />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className={"flex h-16 items-center gap-2"}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <SmilePlus />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full">
                  <EmojiPicker
                    onEmojiClick={(emoji) => setChatInput((prev) => prev + emoji.emoji)}
                    theme={theme as any}
                  />
                </PopoverContent>
              </Popover>

              <MessageUpload onUpload={handleAttachment} variant="image" />
              <MessageUpload onUpload={handleAttachment} variant="file" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleSummarize}
                disabled={isSummarizing || chatMessages.length === 0}
                title="Summarise chat"
              >
                <FileText className={isSummarizing ? "animate-spin" : ""} />
              </Button>

              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send a message…"
                className="flex-1"
              />

              {isRecording && (
                <div className="flex items-center gap-2 text-red-500">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="font-mono text-sm">{Math.floor(recordingDuration / 1000)}s</span>
                </div>
              )}

              <Button
                type="button"
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                onClick={handleMicClick}
                className={isRecording ? "animate-pulse" : ""}
              >
                {isRecording ? <MicOff /> : <Mic />}
              </Button>

              <Button type="submit" size="icon" disabled={!chatInput.trim() && attachments.length === 0}>
                <SendIcon />
              </Button>
            </form>

            {/* Summary Display */}
            {summary && (
              <div className="bg-muted/50 m-2 rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4" />
                    Chat Summary
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setSummary(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  <Markdown>{summary}</Markdown>
                </p>
              </div>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
