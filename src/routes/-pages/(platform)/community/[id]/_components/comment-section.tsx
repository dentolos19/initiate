"use client";

import { SendIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Textarea } from "#/components/ui/textarea";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { CommunityComment, CommunityPost } from "#/lib/backend/connectors/community";
import { useSession } from "#/lib/providers/session";
import CommentItems from "#/routes/-pages/(platform)/community/[id]/_components/comment-items";

export default function CommentSection(props: { data: CommunityPost }) {
  const backend = useBackend();
  const { user } = useSession();

  const [loading, setLoading] = useState<boolean>(true);
  const [comment, setNewComment] = useState<string>("");
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [postingComment, setPostingComment] = useState(false);

  async function handleReplyAdded(parentId: string, reply: CommunityComment) {
    function addReplyRecursive(list: CommunityComment[]): CommunityComment[] {
      return list.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: c.replies ? [reply, ...c.replies] : [reply],
          };
        } else if (c.replies && c.replies.length > 0) {
          return {
            ...c,
            replies: addReplyRecursive(c.replies),
          };
        }
        return c;
      });
    }
    setComments((prev) => addReplyRecursive(prev));
  }

  async function handleComment() {
    if (!comment.trim()) return;

    setPostingComment(true);
    try {
      const newTopComment = await backend.community.postComment(props.data.id, comment.trim());
      setComments((prev) => [newTopComment, ...prev]);
      setNewComment("");
      toast.success("Comment posted successfully");
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const countNestedComments = (comment: CommunityComment): number => {
        let count = 1; // for the comment itself
        if (comment.replies && comment.replies.length > 0) {
          for (const reply of comment.replies) {
            count += countNestedComments(reply);
          }
        }
        return count;
      };

      const findCommentRecursive = (list: CommunityComment[], id: string): CommunityComment | null => {
        for (const comment of list) {
          if (comment.id === id) {
            return comment;
          }
          if (comment.replies && comment.replies.length > 0) {
            const found = findCommentRecursive(comment.replies, id);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      const commentToDelete = findCommentRecursive(comments, commentId);
      const commentsToDeleteCount = commentToDelete ? countNestedComments(commentToDelete) : 0;

      await backend.community.deleteComment(commentId);

      const removeCommentRecursive = (list: CommunityComment[], id: string): CommunityComment[] => {
        return list
          .map((comment) => {
            if (comment.replies && comment.replies.length > 0) {
              comment.replies = removeCommentRecursive(comment.replies, id);
            }
            return comment;
          })
          .filter((comment) => comment.id !== id);
      };

      setComments((prev) => removeCommentRecursive(prev, commentId));
      toast.success("Deleted comment");
    } catch (error) {
      console.error("Failed to delete comment", error);
      toast.error("Failed to delete comment");
    }
  }

  useEffect(() => {
    setLoading(true);
    backend.community
      .getCommentThread(props.data.id)
      .then((comments) => {
        setComments(comments.comments);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <CardHeader className={"flex items-center gap-2"}>
        <Avatar>
          <ImageWrapper src={user?.imageUrl} avatar />
          <AvatarFallback>X</AvatarFallback>
        </Avatar>
        <Textarea
          className={"min-h-8 flex-1 resize-none"}
          placeholder={"Write a comment..."}
          disabled={postingComment}
          value={comment}
          onKeyDown={(e) => e.key === "Enter" && handleComment()}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button disabled={postingComment || !comment.trim()} onClick={handleComment}>
          <SendIcon />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Loading */}
        {loading && (
          <div className={"my-5"}>
            <LoadingSpinner />
          </div>
        )}

        {/* No Items */}
        {!loading && comments.length === 0 && (
          <div className={"my-5 text-center"}>
            <p className={"text-muted-foreground text-sm"}>No comments yet.</p>
          </div>
        )}

        {/* With Items */}
        {comments.length > 0 && (
          <CommentItems
            postId={props.data.id}
            currentUser={user}
            comments={comments}
            onReplyAdded={handleReplyAdded}
            onDeleteComment={handleDeleteComment}
          />
        )}
      </CardContent>
    </Card>
  );
}
