import React from 'react';
import PixelGrid from './PixelGrid';

export default class GridWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false
    };
    this.update = this.props.onCellEvent.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return newProps.cells !== this.props.cells;
  }

  handleMouseUp(id, ev) {
    if (ev.cancelable) {
      if (!ev.defaultPrevented) {
        ev.preventDefault();
      }
    }
    this.setState({
      dragging: false
    });
  }

  handleMouseDown(id, ev) {
    if (ev.cancelable) {
      if (!ev.defaultPrevented) {
        ev.preventDefault();
      }
    }
    if (!this.state.dragging) this.update(id);
    this.setState({
      dragging: true
    });
  }

  handleMouseOver(id, ev) {
    if (ev.cancelable) {
      if (!ev.defaultPrevented) {
        ev.preventDefault();
      }
    }
    if (this.state.dragging) this.update(id);
  }

  handleTouchMove(id, ev) {
    /*
      TODO: It should draw the every cell we are moving over
      like is done in handleMouseOver. But is not working due
      to the nature of the touch events.

      The target element in a touch event is always the one
      when the touch started, not the element under the cursor
      (like the mouse event behaviour)
    */

    if (ev.cancelable) {
      if (!ev.defaultPrevented) {
        ev.preventDefault();
      }
    }

    // 获取touch移动的时候的触点所设计的元素
    // 解决在touchmove过程中，能触发各个小元素的状态变更
    // 使得移动过程中能触发相关其元素进行变色，即使touch的事件并不是由该元素触发的，但还是可以完成其功能
    // 参考链接 https://gist.github.com/vehpus/6fd5dca2ea8cd0eb0471
    
    var boxItem = document.elementFromPoint(ev.targetTouches[0].clientX, ev.targetTouches[0].clientY); 
    if (boxItem) {
      let boxItemIdStr = boxItem.dataset.tagid;
      if (boxItemIdStr) {
        let boxItemId = boxItemIdStr.replace(/tag/gi, '');
        boxItemId = boxItemId >> 0;
        this.update(boxItemId)
      }
    }
    if (this.state.dragging) this.update(id);
  }

  render() {
    return (
      <PixelGrid
        cells={this.props.cells}
        onMouseUp={this.handleMouseUp}
        onMouseDown={this.handleMouseDown}
        onMouseOver={this.handleMouseOver}
        onFocus={this.handleMouseOver}
        onTouchMove={this.handleTouchMove}
        extraClass={this.props.extraClass}
      />
    );
  }
}
