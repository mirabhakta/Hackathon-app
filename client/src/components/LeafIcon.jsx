export default function LeafIcon({ className = "", primary = "var(--wellby-primary)", secondary = "var(--wellby-secondary)" }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={primary} />
      <path
        d="M12 3 C16 5.5,18.5 8,18 12 C17.5 16,15 18,12 18 C9 18,6.5 16,6 12 C5.5 8,8 5.5,12 3Z"
        fill={secondary}
      />
    </svg>
  );
}
