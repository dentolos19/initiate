
import "#/components/ui/custom/rich/rich.styles.css";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Iframe } from "#/components/ui/custom/rich/extensions";
import { Toggle } from "#/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import useBackend from "#/lib/backend/client";
import { cn } from "#/lib/utils";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import {
  BoldIcon,
  CodeIcon,
  CodeSquareIcon,
  FrameIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  UndoIcon,
  VideoIcon,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { usePrompt } from "#/lib/providers/prompt";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import Image from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import Youtube from "@tiptap/extension-youtube";

interface RichEditorProps {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function RichEditor(props: RichEditorProps) {
  const backend = useBackend();
  const { prompt } = usePrompt();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Base extensions
      Document,
      Paragraph,
      Text,

      // Formatting extensions
      Bold,
      Italic,
      Strike,
      Code,
      CodeBlock,
      Blockquote,
      Heading,

      // List extensions
      BulletList,
      OrderedList,
      ListItem,

      // Other essential extensions
      HardBreak,
      History,
      Dropcursor,
      Gapcursor,

      // Media extensions
      Image,
      Iframe,
      Youtube.configure({
        inline: false,
      }),
    ],
    content: props.value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      props.onValueChange?.(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const html = editor.getHTML();
    if (props.value !== html) {
      editor.commands.setContent(props.value || "");
    }
  }, [editor, props.value]);

  if (!editor) {
    return null;
  }

  async function embedFrame() {
    if (!editor) return;

    const url = await prompt("Please enter the URL of the website you want to embed.");
    if (!url) return;

    editor.chain().focus().setIframe({ src: url }).run();
  }

  async function embedVideo() {
    if (!editor) return;

    const url = await prompt("Please enter the URL of the video you want to embed. We only support YouTube for now.");
    if (!url) return;

    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!regex.test(url)) {
      toast.error("Please enter a valid YouTube URL.");
      return;
    }

    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }

  async function embedImage(files: FileList) {
    if (!editor) return;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("Unsupported file type: " + file.name);
        continue;
      }

      backend.assets
        .uploadFile(file)
        .then((asset) => {
          const url = "/assets/" + asset.id;
          editor!.chain().focus().setImage({ src: url }).run();
        })
        .catch((error: Error) => {
          toast.error(error.message);
        });
    }
  }

  return (
    <Card className={"gap-0 overflow-hidden p-0"}>
      <CardHeader className={"bg-muted flex justify-between overflow-x-auto border-b !p-2"}>
        {/* Left */}
        <div className={"flex gap-1"}>
          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Undo"
                type={"button"}
                variant={"ghost"}
                size={"icon"}
                onClick={() => editor.chain().focus().undo().run()}
              >
                <UndoIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Redo"
                type={"button"}
                variant={"ghost"}
                size={"icon"}
                onClick={() => editor.chain().focus().redo().run()}
              >
                <RedoIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          {/* Heading 1 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <Heading1Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>

          {/* Heading 2 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>

          {/* Heading 3 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("heading", { level: 3 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                <Heading3Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>

          {/* Bold */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("bold")}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
              >
                <BoldIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          {/* Italic */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("italic")}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
              >
                <ItalicIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          {/* Strike */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("strike")}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
              >
                <StrikethroughIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>

          {/* Inline Code */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("code")}
                onPressedChange={() => editor.chain().focus().toggleCode().run()}
              >
                <CodeIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Inline Code</TooltipContent>
          </Tooltip>

          {/* Code Block */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("codeBlock")}
                onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <CodeSquareIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>

          {/* Blockquote */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("blockquote")}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <QuoteIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Blockquote</TooltipContent>
          </Tooltip>

          {/* Bullet List */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("bulletList")}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
              >
                <ListIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          {/* Ordered List */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={editor.isActive("orderedList")}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrderedIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Ordered List</TooltipContent>
          </Tooltip>
        </div>

        {/* Right */}
        <div className={"flex gap-1"}>
          {/* Embed Frame */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label="Embed Frame" type={"button"} variant={"ghost"} size={"icon"} onClick={embedFrame}>
                <FrameIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Embed Frame</TooltipContent>
          </Tooltip>

          {/* Embed Video */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label="Embed Video" type={"button"} variant={"ghost"} size={"icon"} onClick={embedVideo}>
                <VideoIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Embed Video</TooltipContent>
          </Tooltip>

          {/* Upload Image */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type={"button"} variant={"ghost"} size={"icon"} asChild>
                <label aria-label="Upload Image">
                  <input
                    className={"hidden"}
                    type={"file"}
                    onChange={(e) => {
                      if (e.target.files) {
                        embedImage(e.target.files);
                      }
                    }}
                  />
                  <ImageIcon />
                </label>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Embed Image</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className={"p-0"}>
        {/* Content */}
        <EditorContent
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none [&_.ProseMirror]:p-4 [&_.ProseMirror]:focus:outline-none",
            props.disabled && "pointer-events-none opacity-50",
            props.className,
          )}
          editor={editor}
        />

        {/* Menu */}
        <BubbleMenu className={"bg-card overflow-hidden rounded-lg shadow-lg"} editor={editor}>
          {/* Heading 1 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={"rounded-none"}
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <Heading1Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>

          {/* Heading 2 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={"rounded-none"}
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>

          {/* Heading 3 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={"rounded-none"}
                pressed={editor.isActive("heading", { level: 3 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                <Heading3Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>

          {/* Bold */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={"rounded-none"}
                pressed={editor.isActive("bold")}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
              >
                <BoldIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          {/* Italic */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={"rounded-none"}
                pressed={editor.isActive("italic")}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
              >
                <ItalicIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          {/* Strike */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={"rounded-none"}
                pressed={editor.isActive("strike")}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
              >
                <StrikethroughIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>
        </BubbleMenu>
      </CardContent>
    </Card>
  );
}
