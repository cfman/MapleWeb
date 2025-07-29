import WZManager from "../wz-utils/WZManager";
import UICommon from "./UICommon";
import MapleInput from "./MapleInput";
import Random from "../Random";
import { MapleStanceButton } from "./MapleStanceButton";
import ClickManager from "./ClickManager";
import MapleFrameButton from "./MapleFrameButton";
import GameCanvas from "../GameCanvas";
import LoginState, {LoginSubState} from '../LoginState';
import Camera from '../Camera';
import WZNode from '../wz-utils/WZNode';

interface UILoginInterface {
  frameImg: any;
  selectWorldChannelImg: any;
  inputUsn: MapleInput | null;
  inputPwd: MapleInput | null;
  newCharStats: number[];
  initialize: (canvas: GameCanvas) => Promise<void>;
  doUpdate: (msPerTick: number, camera: any, canvas: GameCanvas) => void;
  doRender: (
    canvas: GameCanvas,
    camera: any,
    lag: number,
    msPerTick: number,
    tdelta: number
  ) => void;
  removeInputs: () => void;
  drawMask: (canvas: GameCanvas) => void;
  worlds: any[];
  worldImgs: Map<number, WZNode>;
  channels: any[];
  channelImgs: any[];
  scrollOpenFrames: any[];
  getScrollOpenFrames: (uiLogin: WZNode) => any[];
}

const UILogin = {} as UILoginInterface;

UILogin.initialize = async function (canvas: GameCanvas) {
  await UICommon.initialize();
  const uiLogin: any = await WZManager.get("UI.wz/Login.img");

  this.frameImg = uiLogin.Common.frame.nGetImage();
  this.selectWorldChannelImg = uiLogin.Common.step.nGet('1').nGetImage();
  this.worlds = [
    {
      id: 0,
      channelCount: 3,
    },
    {
      id: 16,
      channelCount: 3,
    },
    {
      id: 2,
      channelCount: 3,
    },
  ]; // @todo: from server side

  this.worldImgs = new Map<number, WZNode>();
  uiLogin.WorldSelect.BtWorld.nChildren.forEach((world: WZNode, index: number) => {
    const worldId = Number.parseInt(world.nName);
    if (Number.isNaN(worldId)) {
      return;
    }
    if (!this.worlds.some((item) => {
      return item.id === worldId;
    })) {
      return;
    }
    this.worldImgs.set(worldId, world);
    const worldButton = new MapleStanceButton(canvas, {
      x: -250 + this.worldImgs.size * 27,
      y: -800,
      img: world.nChildren,
      onClick: async () => {
        await LoginState.switchToSubState(LoginSubState.CHARACTER_SELECT); // @todo: show channels
      },
    });
    ClickManager.addButton(worldButton);
  });

  this.scrollOpenFrames = this.getScrollOpenFrames(uiLogin);

  this.inputUsn = new MapleInput(canvas, {
    x: 442,
    y: 236,
    width: 142,
    height: 20,
    color: "#ffffff",
  });
  this.inputPwd = new MapleInput(canvas, {
    x: 442,
    y: 265,
    width: 142,
    height: 20,
    color: "#ffffff",
    type: "password",
  });

  const loginButton = new MapleStanceButton(canvas, {
    x: 223,
    y: -85,
    img: uiLogin.Title.BtLogin.nChildren,
    onClick: async () => {
      await LoginState.switchToSubState(LoginSubState.WORLD_SELECT, canvas);
    },
  });
  ClickManager.addButton(loginButton);

  const startButton = new MapleStanceButton(canvas, {
    x: 205,
    y: -1360,
    img: uiLogin.CharSelect.BtSelect.nChildren,
    onClick: async () => {
      await LoginState.enterGame();
    },
  });
  ClickManager.addButton(startButton);

  /*
  const channelButton = new MapleStanceButton(canvas, {
    x: 50,
    y: 50,
    img: uiLogin.nGet('WorldSelect').nGet('channel')[1].nChildren,
    onClick: () => {
      console.log(`Channel 0 selected!`);
    },
  });
  ClickManager.addButton(channelButton);

  const dice = new MapleFrameButton({
    x: 245,
    y: -1835,
    img: uiLogin.NewChar.dice.nChildren,
    onEndFrame: () => {
      this.newCharStats = Random.generateDiceRollStats();
      console.log("Random stats: ", this.newCharStats);
    },
    hoverAudio: false,
  });
  ClickManager.addButton(dice);
  */

  this.newCharStats = Random.generateDiceRollStats();
};

UILogin.getScrollOpenFrames = function (uiLogin: WZNode) {
  const scrollOpenFrames: any[] = [];
  uiLogin.WorldSelect.scroll.nGet(0).nChildren.forEach((node: WZNode) => {
    scrollOpenFrames.push(node);
  });
  return scrollOpenFrames;
};

UILogin.doUpdate = function (msPerTick, camera, canvas) {

  UICommon.doUpdate(msPerTick);
};

UILogin.doRender = function (canvas, camera, lag, msPerTick, tdelta) {
  // const currDiceFrame = this.dice[this.diceFrame];
  // const currDiceImage = currDiceFrame.nGetImage();
  // canvas.drawImage({
  //   img: currDiceImage,
  //   dx: this.diceX - camera.x - currDiceFrame.origin.nX,
  //   dy: this.diceY - camera.y - currDiceFrame.origin.nY,
  // });

  // this.scrollOpenFrames.forEach((frame: any) => {
  //   const dx = Math.floor(160);
  //   const dy = Math.floor(-830 - Camera.y);
  //
  //   canvas.drawImage({
  //     img: frame.nGetImage(),
  //     dx: dx,
  //     dy: dy,
  //   });
  // });

  canvas.drawImage({
    img: this.frameImg,
    dx: 0,
    dy: 0,
  });

  canvas.drawImage({
    img: this.selectWorldChannelImg,
    dx: 0,
    dy: -880 - Camera.y,
  });

  canvas.drawText({
    text: "Ver. 0.83",
    fontWeight: "bold",
    x: 595,
    y: 13,
  });

  this.drawMask(canvas);

  UICommon.doRender(canvas, camera, lag, msPerTick, tdelta);
};

UILogin.drawMask = function (canvas) {
  const frameWidth = this.frameImg.width;
  const frameHeight = this.frameImg.height;
  const frameX = 0;
  const frameY = 0;
  canvas.context.fillStyle = "#000000";
  const canvasWidth = canvas.context.canvas.width;
  const canvasHeight = canvas.context.canvas.height;

  // Draw black rectangles to mask areas outside the frame
  canvas.context.fillRect(0, 0, frameX, canvasHeight); // Left mask
  canvas.context.fillRect(frameX + frameWidth,0, canvasWidth - (frameX + frameWidth), canvasHeight); // Right mask
  canvas.context.fillRect(frameX,0, frameWidth, frameY); // Top mask
  canvas.context.fillRect(frameX, frameY + frameHeight, frameWidth, canvasHeight - (frameY + frameHeight)); // Bottom mask
  canvas.context.restore();
};

UILogin.removeInputs = function () {
  if (this.inputUsn) this.inputUsn.remove();
  if (this.inputPwd) this.inputPwd.remove();
  this.inputUsn = null;
  this.inputPwd = null;
};

export default UILogin;
