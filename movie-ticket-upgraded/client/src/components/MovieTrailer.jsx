function toEmbedUrl(url = '') {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : url;
}
export default function MovieTrailer({ url }) {
  if (!url) return <div className="empty-state">Phim chưa có trailer.</div>;
  return <div className="trailer-frame"><iframe src={toEmbedUrl(url)} title="Trailer phim" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
}
