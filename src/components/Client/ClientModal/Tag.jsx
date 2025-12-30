export default function Tag({ tag }) {
  /* tag может быть строкой или {name,color} */
  const label = typeof tag === 'string' ? tag : tag.name;
  const bg    = typeof tag === 'object' && tag.color ? tag.color : 'var(--container-hover-bg)';
  return (
    <span className="tag-chip" style={{background:bg}}>
      {label}
    </span>
  );
}
