import { useBookmarks } from "@/hooks/use-bookmarks";
import { useAuth } from "@/hooks/use-auth";
import { StoryCard } from "@/components/StoryCard";
import { Bookmark, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function SavedStoriesPage() {
  const { bookmarks, isLoading } = useBookmarks();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Bookmark className="w-16 h-16 mx-auto text-muted-foreground/40 mb-6" />
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4" data-testid="text-saved-title">Saved Stories</h1>
        <p className="text-muted-foreground mb-8">Sign in to save stories and read them later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Bookmark className="w-6 h-6 text-foreground" />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground" data-testid="text-saved-title">Saved Stories</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-9">Your bookmarked stories for later reading.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20" data-testid="loading-saved">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20" data-testid="empty-saved">
          <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-2">No saved stories yet.</p>
          <p className="text-sm text-muted-foreground/70">
            Tap the bookmark icon on any story to save it here.{" "}
            <Link href="/feed" className="text-primary hover:underline">Browse the feed</Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="saved-stories-list">
          {bookmarks.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
