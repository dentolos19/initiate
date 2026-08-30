import { formatDistanceToNow } from "date-fns";
import { Check, MessageCircle, PencilIcon, Send, Trash2Icon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { CommunityComment } from "#/lib/backend/connectors/community";
import { User } from "#/lib/backend/schema";

interface CommentsProps {
  comments: CommunityComment[];
  postId: string;
  onReplyAdded?: (parentId: string, reply: CommunityComment) => void;
  onDeleteComment?: (commentId: string) => void;
  onCommentUpdated?: (commentId: string, newContent: string) => void;
  currentUser?: User | null;
}

function CommentThread({
  comment,
  postId,
  onReplyAdded,
  onDeleteComment,
  onCommentUpdated,
  currentUser,
  level = 0,
}: {
  comment: CommunityComment;
  postId: string;
  onReplyAdded?: (parentId: string, reply: CommunityComment) => void;
  onDeleteComment?: (commentId: string) => void;
  onCommentUpdated?: (commentId: string, newContent: string) => void;
  currentUser?: User | null;
  level?: number;
}) {
  const [reply, setReply] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [posting, setPosting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [updating, setUpdating] = useState(false);
  const backend = useBackend();
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  const handleReply = function handleSubmitReply() {
    if (!reply.trim()) return;
    setPosting(true);

    backend.community
      .replyToComment(postId, comment.id, reply.trim())
      .then(function handleReplySuccess(newReply) {
        if (onReplyAdded) {
          onReplyAdded(comment.id, newReply);
        }
        setReply("");
        setShowReplyBox(false);
        toast.success("Reply posted successfully");
      })
      .catch(function handleReplyError(error) {
        console.error("Failed to post reply:", error);
        toast.error("Failed to post reply");
      })
      .finally(function cleanupPosting() {
        setPosting(false);
      });
  };

  const [localContent, setLocalContent] = useState(comment.content);

  const handleUpdateComment = function handleCommentUpdate() {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }

    setUpdating(true);
    const updatedContent = editContent.trim();

    backend.community
      .updateComment(comment.id, updatedContent)
      .then(function handleUpdateSuccess() {
        // Update local state immediately for UI responsiveness
        setLocalContent(updatedContent);

        if (onCommentUpdated) {
          onCommentUpdated(comment.id, updatedContent);
        }
        setIsEditing(false);
        toast.success("Comment updated successfully");
      })
      .catch(function handleUpdateError(error) {
        console.error("Failed to update comment:", error);
        toast.error("Failed to update comment");
        setEditContent(comment.content);
      })
      .finally(function cleanupUpdating() {
        setUpdating(false);
      });
  };

  const handleKeyPress = function handleEnterKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const handleEditKeyPress = function handleEditEnterKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleUpdateComment();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const toggleReplyBox = function handleToggleReplyBox() {
    setShowReplyBox(!showReplyBox);
    if (showReplyBox) {
      setReply("");
    }
  };

  const startEdit = function handleStartEdit() {
    setIsEditing(true);
    setEditContent(localContent);
  };

  const cancelEdit = function handleCancelEdit() {
    setIsEditing(false);
    setEditContent(localContent);
  };

  const isCurrentUserComment = currentUser && currentUser.id === comment.user.id;

  return (
    <div className={`${level === 1 ? "border-muted ml-6 border-l-2 pl-4" : ""}`}>
      <div className="mb-3 flex items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <ImageWrapper src={comment.user.imageUrl} alt={comment.user.firstName} avatar />
          <AvatarFallback className="text-xs">
            {comment.user.firstName[0]}
            {comment.user.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.user.firstName} {comment.user.lastName}
            </span>
            <span className={"text-muted-foreground text-xs"}>{timeAgo}</span>
          </div>

          {isEditing ? (
            <div className={"relative mb-2"}>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyPress}
                className={"min-h-[40px] resize-none py-2 pr-16 text-sm"}
                rows={2}
                disabled={updating}
                autoFocus
              />
              <div className={"absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1"}>
                <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={updating} className={"h-7 w-7 p-0"}>
                  <X className={"h-3 w-3"} />
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdateComment}
                  disabled={updating || !editContent.trim() || editContent === localContent}
                  className={"h-7 w-7 p-0"}
                >
                  <Check className={"h-3 w-3"} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-2 text-sm break-words">
              {level > 0 && comment.replyingTo && (
                <span className={"text-primary font-medium"}>@{comment.replyingTo.firstName} </span>
              )}
              {localContent}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleReplyBox}
              className={"text-muted-foreground hover:text-foreground h-6 px-2 text-xs"}
              disabled={isEditing}
            >
              <MessageCircle className={"mr-1 h-3 w-3"} />
              {showReplyBox ? "Cancel" : "Reply"}
            </Button>

            {isCurrentUserComment && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startEdit}
                  className={"text-muted-foreground h-6 px-2 text-xs hover:text-blue-500"}
                  disabled={isEditing}
                >
                  <PencilIcon className={"mr-1 h-3 w-3"} />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteComment?.(comment.id)}
                  className={"text-muted-foreground hover:text-destructive h-6 px-2 text-xs"}
                  disabled={isEditing}
                >
                  <Trash2Icon className={"mr-1 h-3 w-3"} />
                  Delete
                </Button>
              </>
            )}
          </div>

          {showReplyBox && !isEditing && (
            <div className={"mt-2 flex items-center gap-2"}>
              <div className={"relative flex-1"}>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Reply to ${comment.user.firstName}`}
                  className={"min-h-[40px] resize-none py-2 pr-10 text-sm"}
                  rows={1}
                />
                <Button
                  size="sm"
                  className={"absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"}
                  onClick={handleReply}
                  disabled={posting || !reply.trim()}
                  variant="ghost"
                >
                  <Send className={"h-3 w-3"} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((replyComment) => (
            <CommentThread
              key={replyComment.id}
              comment={replyComment}
              postId={postId}
              onReplyAdded={onReplyAdded}
              onDeleteComment={onDeleteComment}
              onCommentUpdated={onCommentUpdated}
              currentUser={currentUser}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentItems({
  comments,
  postId,
  onReplyAdded,
  onDeleteComment,
  onCommentUpdated,
  currentUser,
}: CommentsProps) {
  return (
    <div className="space-y-4">
      {comments
        .filter((comment) => !comment.commentId)
        .map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            postId={postId}
            onReplyAdded={onReplyAdded}
            onDeleteComment={onDeleteComment}
            onCommentUpdated={onCommentUpdated}
            currentUser={currentUser}
            level={0}
          />
        ))}
    </div>
  );
}
