import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { MapMode, Territory } from '../map/territories';

export type QuickAction = 'inspect' | 'focus' | 'mark' | 'clear-mark' | 'reset'
  | 'natural' | 'political' | 'resources';
export type QuickMenuState = {
  x: number;
  y: number;
  territory: Territory | null;
  worldPoint: { x: number; y: number };
};
type Props = {
  menu: QuickMenuState;
  mode: MapMode;
  hasMarker: boolean;
  onAction: (action: QuickAction) => void;
  onClose: () => void;
};

type ItemProps = {
  symbol: string;
  label: string;
  detail?: string;
  current?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};
function Action({ symbol, label, detail, current, disabled, onClick }: ItemProps) {
  return (
    <button type="button" role="menuitem" className={`quick-menu-item${current ? ' quick-menu-item--current' : ''}`}
      disabled={disabled} onClick={onClick} title={disabled ? 'Sẽ hoạt động khi gameplay được triển khai' : undefined}>
      <span className="quick-menu-symbol" aria-hidden="true">{symbol}</span>
      <span className="quick-menu-item-copy"><strong>{label}</strong>{detail && <small>{detail}</small>}</span>
      {current && <span className="quick-menu-check" aria-hidden="true">✓</span>}
      {disabled && <span className="quick-menu-lock" aria-hidden="true">⌁</span>}
    </button>
  );
}

/** Client-only quick actions; locked gameplay commands are deliberately non-operational. */
export function MapContextMenu({ menu, mode, hasMarker, onAction, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)')?.focus();
  }, [menu]);
  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : event.key === 'ArrowDown' ? (current + 1) % items.length
        : (current - 1 + items.length) % items.length;
    items[target]?.focus();
    event.preventDefault();
  };
  return (
    <div ref={menuRef} className="map-context-menu" role="menu"
      aria-label={menu.territory ? `Quân lệnh nhanh tại ${menu.territory.name}` : 'Quân lệnh trên sa bàn'}
      style={{ left: menu.x, top: menu.y }} onKeyDown={handleKeys}
      onPointerDown={event => event.stopPropagation()} onContextMenu={event => event.preventDefault()}>
      <div className="quick-menu-heading">
        <span className="quick-menu-seal" aria-hidden="true">令</span>
        <span><small>QUÂN LỆNH NHANH</small><strong>{menu.territory?.name ?? 'Toàn sa bàn'}</strong></span>
        <button type="button" className="quick-menu-close" onClick={onClose} aria-label="Đóng menu">×</button>
      </div>
      {menu.territory && <>
        <div className="quick-menu-section">LÃNH THỔ</div>
        <Action symbol="▤" label="Xem địa chí" detail="Mở thông tin vùng" onClick={() => onAction('inspect')}/>
        <Action symbol="⌖" label="Định vị vùng" detail="Di chuyển camera tới trấn" onClick={() => onAction('focus')}/>
      </>}
      <div className="quick-menu-section">SA BÀN</div>
      <Action symbol="⚑" label="Đặt dấu chỉ huy" detail="Ghim dấu tạm tại vị trí này" onClick={() => onAction('mark')}/>
      {hasMarker && <Action symbol="×" label="Xóa dấu chỉ huy" onClick={() => onAction('clear-mark')}/>}
      <Action symbol="⌂" label="Xem toàn bản đồ" onClick={() => onAction('reset')}/>
      <div className="quick-menu-section">CHẾ ĐỘ QUAN SÁT</div>
      <div className="quick-menu-mode-row">
        <button type="button" role="menuitem" aria-label="Bản đồ địa hình"
          aria-current={mode === 'natural' ? 'true' : undefined}
          className={mode === 'natural' ? 'is-active' : ''} onClick={() => onAction('natural')}>◒ <span>Địa hình</span></button>
        <button type="button" role="menuitem" aria-label="Bản đồ chủ quyền"
          aria-current={mode === 'political' ? 'true' : undefined}
          className={mode === 'political' ? 'is-active' : ''} onClick={() => onAction('political')}>◇ <span>Chủ quyền</span></button>
        <button type="button" role="menuitem" aria-label="Bản đồ tài nguyên"
          aria-current={mode === 'resources' ? 'true' : undefined}
          className={mode === 'resources' ? 'is-active' : ''} onClick={() => onAction('resources')}>✥ <span>Tài nguyên</span></button>
      </div>
      {menu.territory && <>
        <div className="quick-menu-section">LỆNH VƯƠNG QUỐC <span>PHASE 3–4</span></div>
        <Action symbol="▥" label="Xây dựng / nâng cấp" disabled/>
        <Action symbol="⚔" label="Tuyển quân / điều quân" disabled/>
      </>}
      <div className="quick-menu-foot">Nhấn Esc hoặc nhấp ra ngoài để đóng</div>
    </div>
  );
}
