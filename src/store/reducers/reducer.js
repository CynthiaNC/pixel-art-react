import { List, Map } from 'immutable';
import {
  createGrid, resizeGrid, createPalette, resetIntervals, setGridCellValue,
  checkColorInPalette, addColorToLastCellInPalette, getPositionFirstMatchInPalette,
  applyBucket, cloneGrid, GRID_INITIAL_COLOR, isPaletteColorSelected,
  resetPaletteSelectedColorState
} from './reducerHelpers';
import * as types from '../actions/actionTypes';

function setInitialState(state, options = {}) {
  const cellSize = 10;
  const columns = options.columns || 20;
  const rows = options.rows || 20;
  const currentColor = { color: '#000000', position: 0 };
  const frame = createGrid(columns * rows, 100);
  const paletteGrid = createPalette();

  const initialState = {
    frames: [frame],
    paletteGridData: paletteGrid,
    cellSize,
    columns,
    rows,
    currentColor,
    eraserOn: false,
    eyedropperOn: false,
    colorPickerOn: false,
    bucketOn: false,
    loading: false,
    notifications: List(),
    activeFrameIndex: 0,
    duration: 1
  };

  return state.merge(initialState);
}

function changeDimensions(state, gridProperty, behaviour) {
  const framesCount = state.get('frames').size;
  const propertyValue = state.get(gridProperty);
  let newFrames = List();

  for (let i = 0; i < framesCount; i++) {
    console.log(state.get('columns'), 'columns')
    newFrames = newFrames.push(Map({
      grid:
        resizeGrid(
          state.getIn(['frames', i, 'grid']),
          gridProperty,
          behaviour,
          { columns: state.get('columns'), rows: state.get('rows') }
        ),
      interval: state.getIn(['frames', i, 'interval']),
      key: state.getIn(['frames', i, 'key'])
    }));
  }

  const newValues = {
    frames: newFrames
  };
  newValues[gridProperty] = parseInt(
    behaviour === 'add' ? propertyValue + 1 : propertyValue - 1,
    10
  );
  return state.merge(newValues);
}

function setColorSelected(state, newColorSelected, positionInPalette) {
  const newColor = { color: newColorSelected, position: positionInPalette };
  const newState = {
    eraserOn: false,
    eyedropperOn: false,
    colorPickerOn: false
  };
  let paletteGridData = state.get('paletteGridData');

  if (!checkColorInPalette(paletteGridData, newColorSelected)) {
    // If there is no newColorSelected in the palette it will create one
    paletteGridData = addColorToLastCellInPalette(
      paletteGridData,
      newColorSelected
    );
    newColor.position = paletteGridData.size - 1;
  } else if (positionInPalette === null) {
    // Eyedropper called this function, the color position is unknown
    newColor.position =
      getPositionFirstMatchInPalette(paletteGridData, newColorSelected);
  }
  newState.currentColor = newColor;
  newState.paletteGridData = paletteGridData;

  return state.merge(newState);
}

function setCustomColor(state, customColor) {
  const currentColor = state.get('currentColor');
  const paletteGridData = state.get('paletteGridData');
  const newState = {
    currentColor: {
      color: customColor,
      position: currentColor.get('position')
    }
  };

  if (!checkColorInPalette(paletteGridData, currentColor.get('color'))) {
    // If there is no colorSelected in the palette it will create one
    newState.paletteGridData = addColorToLastCellInPalette(
      paletteGridData,
      customColor
    );
    newState.currentColor.position = newState.paletteGridData.size - 1;
  } else {
    // There is a color selected in the palette
    newState.paletteGridData = paletteGridData.set(
      currentColor.get('position'),
      Map({
        color: customColor, id: currentColor.get('color')
      })
    );
  }

  return state.merge(newState);
}

function drawCell(state, id) {
  const bucketOn = state.get('bucketOn');
  const eyedropperOn = state.get('eyedropperOn');
  const eraserOn = state.get('eraserOn');
  let newState = state;
  let color = '';

  if (bucketOn || eyedropperOn) {
    const activeFrameIndex = state.get('activeFrameIndex');
    const cellColor = state.getIn(['frames', activeFrameIndex, 'grid', id]) || GRID_INITIAL_COLOR;

    if (eyedropperOn) {
      return setColorSelected(newState, cellColor, null);
    }
    // bucketOn
    return applyBucket(newState, activeFrameIndex, id, cellColor);
  }
  // regular cell paint
  if (!eraserOn) {
    if (!isPaletteColorSelected(newState)) {
      newState = resetPaletteSelectedColorState(newState);
    }
    color = newState.get('currentColor').get('color');
  }
  return setGridCellValue(newState, color, id);
}

function setDrawing(state, frames, paletteGridData, cellSize, columns, rows) {
  return state.merge({
    frames,
    paletteGridData,
    cellSize,
    columns,
    rows,
    activeFrameIndex: 0
  });
}

function setEraser(state) {
  return state.merge({
    currentColor: { color: null, position: -1 },
    eraserOn: true,
    eyedropperOn: false,
    colorPickerOn: false,
    bucketOn: false
  });
}

function setBucket(state) {
  return state.merge({
    eraserOn: false,
    eyedropperOn: false,
    colorPickerOn: false,
    bucketOn: !state.get('bucketOn')
  });
}

function setEyedropper(state) {
  return state.merge({
    eraserOn: false,
    eyedropperOn: true,
    colorPickerOn: false,
    bucketOn: false
  });
}

function setColorPicker(state) {
  return state.merge({
    eraserOn: false,
    eyedropperOn: false,
    colorPickerOn: true,
    bucketOn: false
  });
}

function setCellSize(state, cellSize) {
  return state.merge({ cellSize });
}

function resetGrid(state, columns, rows, activeFrameIndex) {
  const currentInterval = state.get('frames').get(activeFrameIndex).get('interval');
  const newGrid = createGrid(
    parseInt(columns, 10) * parseInt(rows, 10),
    currentInterval
  );

  return state.merge({
    frames: state.get('frames').update(activeFrameIndex, () => newGrid)
  });
}

function showSpinner(state) {
  return state.merge({ loading: true });
}

function hideSpinner(state) {
  return state.merge({ loading: false });
}

function sendNotification(state, message) {
  return state.merge({
    notifications: message === '' ? List() : List([{ message, id: 0 }])
  });
}

function changeActiveFrame(state, frameIndex) {
  return state.merge({ activeFrameIndex: frameIndex });
}

function createNewFrame(state) {
  const newFrames = state.get('frames').push(createGrid(
    parseInt(state.get('columns'), 10) * parseInt(state.get('rows'), 10),
    100
  ));
  return state.merge({
    frames: resetIntervals(newFrames),
    activeFrameIndex: newFrames.size - 1
  });
}

function deleteFrame(state, frameId) {
  const activeFrameIndex = state.get('activeFrameIndex');
  const newState = {};
  let frames = state.get('frames');

  if (frames.size > 1) {
    const reduceFrameIndex =
      (activeFrameIndex >= frameId) &&
      (activeFrameIndex > 0);

    frames = frames.splice(frameId, 1);
    newState.frames = resetIntervals(frames);

    if (reduceFrameIndex) {
      newState.activeFrameIndex = frames.size - 1;
    }
  }
  return state.merge(newState);
}

function duplicateFrame(state, frameId) {
  const frames = state.get('frames');
  const prevFrame = frames.get(frameId);
  return state.merge({
    frames: resetIntervals(frames.splice(
      frameId,
      0,
      cloneGrid(prevFrame.get('grid'), prevFrame.get('interval'))
    )),
    activeFrameIndex: frameId + 1
  });
}

function setDuration(state, duration) {
  return state.merge({ duration });
}

function changeFrameInterval(state, frameIndex, interval) {
  return state.merge({
    frames: state.get('frames').updateIn(
      [frameIndex, 'interval'],
      () => interval
    )
  });
}

export default function (state = Map(), action) {
  switch (action.type) {
    case types.SET_INITIAL_STATE:
      return setInitialState(state, action.options);
    case types.CHANGE_DIMENSIONS:
      return changeDimensions(state, action.gridProperty, action.behaviour);
    case types.SET_COLOR_SELECTED:
      return setColorSelected(
        state,
        action.newColorSelected,
        action.paletteColorPosition
      );
    case types.SET_CUSTOM_COLOR:
      return setCustomColor(state, action.customColor);
    case types.DRAW_CELL:
      return drawCell(state, action.id);
    case types.SET_DRAWING:
      return setDrawing(
        state, action.frames, action.paletteGridData,
        action.cellSize, action.columns, action.rows
      );
    case types.SET_ERASER:
      return setEraser(state);
    case types.SET_BUCKET:
      return setBucket(state);
    case types.SET_EYEDROPPER:
      return setEyedropper(state);
    case types.SET_COLOR_PICKER:
      return setColorPicker(state);
    case types.SET_CELL_SIZE:
      return setCellSize(state, action.cellSize);
    case types.SET_RESET_GRID:
      return resetGrid(
        state, action.columns, action.rows,
        action.activeFrameIndex
      );
    case types.SHOW_SPINNER:
      return showSpinner(state);
    case types.HIDE_SPINNER:
      return hideSpinner(state);
    case types.SEND_NOTIFICATION:
      return sendNotification(state, action.message);
    case types.CHANGE_ACTIVE_FRAME:
      return changeActiveFrame(state, action.frameIndex);
    case types.CREATE_NEW_FRAME:
      return createNewFrame(state);
    case types.DELETE_FRAME:
      return deleteFrame(state, action.frameId);
    case types.DUPLICATE_FRAME:
      return duplicateFrame(state, action.frameId);
    case types.SET_DURATION:
      return setDuration(state, action.duration);
    case types.CHANGE_FRAME_INTERVAL:
      return changeFrameInterval(state, action.frameIndex, action.interval);
    case types.NEW_PROJECT:
      return setInitialState(state, action.options);
    default:
  }
  return state;
}
