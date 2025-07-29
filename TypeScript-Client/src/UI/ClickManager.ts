import { MapleStanceButton, BUTTON_STANCE } from "./MapleStanceButton";
import MapleFrameButton from "./MapleFrameButton";
import UICommon from "./UICommon";
import GUIUtil from "../GuiUtils";
import GameCanvas from "../GameCanvas";
import MapleMap from "../MapleMap";
import UIMap from "./UIMap";
import MapleButton from "./MapleButton";
import DragableMenu from "./Menu/DragableMenu";
import { CameraInterface } from "../Camera";

export interface ClickManagerInterface {
  clicked: boolean;
  lastClickedPosition: { x: number; y: number };
  activeButton: any;
  buttons: {
    stanceButton: Set<MapleStanceButton>;
    frameButton: Set<MapleFrameButton>;
  };
  dragableMenus: any[];
  GameCanvas: GameCanvas;
  initialize: (canvas: GameCanvas) => void;
  doUpdate: (msPerTick: number, camera: any) => void;
  addDragableMenu: (menu: any) => void;
  addButton: (button: any) => void;
  removeButton: (button: any) => void;
  clearButton: () => void;

  chosenMenu: DragableMenu | null;
  lastClickedMenuPosition: { x: number; y: number } | null;
}

const ClickManager = {} as ClickManagerInterface;

ClickManager.initialize = function (canvas: GameCanvas) {
  this.clicked = false;
  this.lastClickedPosition = { x: 0, y: 0 };
  this.activeButton = null;
  this.buttons = {
    stanceButton: new Set<MapleStanceButton>(),
    frameButton: new Set<MapleFrameButton>(),
  };
  this.dragableMenus = [];
  this.GameCanvas = canvas;
};

ClickManager.doUpdate = function (msPerTick: number, camera: CameraInterface) {
  const mousePoint = { x: this.GameCanvas.mouseX, y: this.GameCanvas.mouseY };
  // const mousePoint = UICommon.getMousePosition(this.GameCanvas)
  const clickedOnLastUpdate = this.clicked;
  const clickedOnThisUpdate = this.GameCanvas.clicked;
  const releasedClick = clickedOnLastUpdate && !clickedOnThisUpdate;
  const lastActiveButton = this.activeButton;
  const buttons: MapleButton[] = [
    ...Array.from(this.buttons.stanceButton.values()),
    ...Array.from(this.buttons.frameButton.values()),
  ].filter((button) => !button.isHidden);
  let currActiveButton = null;

  if (buttons.length === 0) {
    return;
  }

  for (const button of buttons) {
    const buttonRect = button.getRect(camera);
    const hoverButton = GUIUtil.pointInRectangle(mousePoint, buttonRect);

    if (hoverButton) {
      currActiveButton = button;
      break;
    }
  }

  // hover event
  if (lastActiveButton !== currActiveButton) {
    this.activeButton = currActiveButton;
    this.buttons.stanceButton.forEach(
      (button) => (button.stance = BUTTON_STANCE.NORMAL)
    );
    for (const button of this.buttons.stanceButton) {
      if (this.activeButton === button) {
        if (button.hoverAudio) {
          UICommon.playMouseHoverAudio();
        }
        if (typeof button.stances[BUTTON_STANCE.MOUSE_OVER] !== 'undefined') {
          button.stance = BUTTON_STANCE.MOUSE_OVER;
        }
        break;
      }
    }
  }

  // click event
  for (const button of buttons) {
    if (clickedOnThisUpdate && !clickedOnLastUpdate) {
      // Try handling clicks on dragable menus first
      for (const menu of this.dragableMenus) {
        if (menu.onMouseDown && menu.onMouseDown(mousePoint.x, mousePoint.y)) {
          break;
        }
      }
    }

    if (this.activeButton === button) {
      const originallyClickedButton = GUIUtil.pointInRectangle(
        this.lastClickedPosition,
        button.getRect(camera)
      );
      if (clickedOnThisUpdate) {
        switch (button.constructor) {
          case MapleStanceButton: {
            const stanceButton = button as MapleStanceButton;
            stanceButton.stance = !originallyClickedButton
              ? (typeof button.stances[BUTTON_STANCE.MOUSE_OVER] !== 'undefined' ? BUTTON_STANCE.MOUSE_OVER : BUTTON_STANCE.NORMAL)
              : (typeof button.stances[BUTTON_STANCE.PRESSED] !== 'undefined' ? BUTTON_STANCE.PRESSED : BUTTON_STANCE.NORMAL);
            break;
          }
          case MapleFrameButton: {
            break;
          }
        }
      } else {
        switch (button.constructor) {
          case MapleStanceButton: {
            const stanceButton = button as MapleStanceButton;
            if (typeof button.stances[BUTTON_STANCE.MOUSE_OVER] !== 'undefined') {
              stanceButton.stance = BUTTON_STANCE.MOUSE_OVER;
            }
            const trigger = releasedClick && originallyClickedButton;
            if (trigger) {
              if (button.clickAudio) {
                UICommon.playMouseClickAudio();
              }
              button.trigger();
            }
            break;
          }
          case MapleFrameButton: {
            const frameButton = button as MapleFrameButton;
            const trigger =
              releasedClick && originallyClickedButton && frameButton.canClick;
            if (trigger) {
              frameButton.canClick = false;
              frameButton.canUpdate = true;
              if (button.clickAudio) {
                UICommon.playMouseClickAudio();
              }
            }
            break;
          }
        }
      }

      if (clickedOnThisUpdate) {
        if (!clickedOnLastUpdate) {
          this.lastClickedPosition = mousePoint;
        }
      }
      //   this.clicked = true;
      // } else {
      //   this.clicked = false;
      // }

      break;
    }

    if (!this.activeButton) {
      if (!clickedOnThisUpdate) {
        this.chosenMenu = null;
        this.lastClickedMenuPosition = null;
      } else {
        for (const dragableMenu of this.dragableMenus) {
          const menuRect = dragableMenu.getRect(camera);
          const isMenuUnderMouse = GUIUtil.pointInRectangle(
            mousePoint,
            menuRect
          );
          if (isMenuUnderMouse || this.chosenMenu === dragableMenu) {
            if (this.chosenMenu !== dragableMenu && !clickedOnLastUpdate) {
              this.chosenMenu = dragableMenu;
              this.lastClickedMenuPosition = mousePoint;
            } else {
              if (
                clickedOnThisUpdate &&
                clickedOnLastUpdate &&
                this.lastClickedMenuPosition
              ) {
                // move menu to current mouse position - original mouse position
                const deltaX = mousePoint.x - this.lastClickedMenuPosition.x;
                const deltaY = mousePoint.y - this.lastClickedMenuPosition.y;
                dragableMenu.moveTo({
                  x: dragableMenu.x + deltaX,
                  y: dragableMenu.y + deltaY,
                });

                this.lastClickedMenuPosition = mousePoint;
              }

              break;
            }
          }
        }
      }
    }
  }

  if (clickedOnThisUpdate) {
    this.clicked = true;
  } else {
    this.clicked = false;
  }
};

ClickManager.addDragableMenu = function (menu) {
  this.dragableMenus.push(menu);
};

ClickManager.addButton = function (button) {
  switch (button.constructor) {
    case MapleStanceButton: {
      this.buttons.stanceButton.add(button);
      break;
    }
    case MapleFrameButton: {
      this.buttons.frameButton.add(button);
      break;
    }
    default: {
      throw new Error("Only button is accepted!!");
    }
  }
  if (button.isPartOfUI) {
    UIMap.clickManagerObjects.add(button);
  } else {
    MapleMap.clickManagerObjects.add(button);
  }
};

ClickManager.removeButton = function (button) {
  if (button instanceof MapleStanceButton) {
    this.buttons.stanceButton.delete(button);
  } else if (button instanceof MapleFrameButton) {
    this.buttons.frameButton.delete(button);
  }

  if (button.isPartOfUI) {
    UIMap.clickManagerObjects.delete(button);
  } else {
    MapleMap.clickManagerObjects.delete(button);
  }
};

ClickManager.clearButton = function () {
  this.buttons.stanceButton.clear();
  this.buttons.frameButton.clear();
};

export default ClickManager;
