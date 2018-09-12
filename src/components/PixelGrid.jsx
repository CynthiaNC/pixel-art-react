import React from 'react';
import PixelCell from './PixelCell';

const PixelGrid = ({
  cells, onMouseUp, onMouseDown, onMouseOver, onTouchMove, extraClass
}) => (
  <div
    className={`grid-container ${extraClass}`}

  >
    {cells.map(cell => (
      <PixelCell
        key={cell.id}
        cell={cell}
        id={cell.id}
        onMouseUp={(id, ev) => (cell.disabled ? {} : onMouseUp(id, ev))}
        onMouseDown={(id, ev) => (cell.disabled ? {} : onMouseDown(id, ev))}
        onMouseOver={(id, ev) => (cell.disabled ? {} : onMouseOver(id, ev))}
        onFocus={(id, ev) => (cell.disabled ? {} : onMouseOver(id, ev))}
        onTouchMove={(id, ev) => (cell.disabled ? {} : onTouchMove(id, ev))}
        onTouchStart={(id, ev) => (cell.disabled ? {} : onMouseDown(id, ev))}
        onTouchEnd={(id, ev) => (cell.disabled ? {} : onMouseUp(id, ev))}
      />
    ))}
  </div>
);
export default PixelGrid;
