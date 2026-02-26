import { useNavigate } from 'react-router-dom';

// Renders a text string and turns @username patterns into clickable spans
export function renderMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return <MentionLink key={i} username={username} />;
    }
    return part;
  });
}

function MentionLink({ username }: { username: string }) {
  const navigate = useNavigate();
  return (
    <button
      className="text-brand font-semibold hover:underline"
      onClick={() => navigate(`/${username}`)}
    >
      @{username}
    </button>
  );
}
