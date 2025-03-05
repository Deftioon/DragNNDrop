import { FC, useRef, useEffect } from "react";
import "./ContextMenu.css";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
}

const ContextMenu: FC<ContextMenuProps> = ({ x, y, onClose, onDelete }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  return (
    <div ref={menuRef} className="context-menu" style={{ top: y, left: x }}>
      <div className="context-menu-item delete" onClick={onDelete}>
        <span>🗑️</span>&nbsp;Delete Connection
      </div>
    </div>
  );
};

export default ContextMenu;
