import { useEffect, useState } from 'react';

export function OutlinedIconBtn({ children, onClick, color = '#fff', disabled = false, title }) {
  return (
    <button
      className="outlined-icon-btn"
      style={{ color, borderColor: color }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

export function ImageWithLoader({ src, alt = '', className = '', style = {} }) {
  const [loaded, setLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  useEffect(() => {
    setImageSrc(src);
    setLoaded(false);
  }, [src]);
  return (
    <div className={`img-loader-wrap ${className}`} style={style}>
      <img
        key={imageSrc}
        src={imageSrc}
        alt={alt}
        className="img-loader-img"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (imageSrc !== '/assets/pictures/bg/bg_borukva-monochrome.png') {
            setImageSrc('/assets/pictures/bg/bg_borukva-monochrome.png');
          }
        }}
        style={{ opacity: loaded ? 1 : 0 }}
      />
      {!loaded && <div className="spinner" />}
    </div>
  );
}
