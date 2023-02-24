import Changelog from "./changelog/Changelog";
import $ from 'jquery'
import { handleFile } from "../game2.js";
import LoadingScreen from "./LoadingScreen";
import { useSelector, useDispatch } from "react-redux";
import { setMainMode } from "../slices/mainModeSlice";
import { setDivStyle, setStats, setPlayerList, setPlayerPos } from "../slices/gameStatsSlice";
import GameStats from "./game stats/GameStats";

export function showStats() { }
export function setGameStats() { }
export function dispatchPlayerList() { }
export function dispatchPlayerPos() { }

function Home() {

  const dispatch = useDispatch();
  const mainMode = useSelector((state) => state.mainMode.value);
  const version = useSelector((state) => state.mainMode.version);

  function showStatsExp(elStyle) {
    const { offsetLeft, offsetTop, clientWidth, clientHeight } = elStyle;
    const offsetParentTop = elStyle.offsetParent.offsetTop;
    dispatch(setDivStyle({ offsetLeft, offsetTop, offsetParentTop, clientWidth, clientHeight }));
    dispatch(setMainMode('stats'));
  }

  function setGameStatsExp(stats) {
    dispatch(setStats(stats));
  }

  function setPlayerListExp(el) {
    dispatch(setPlayerList(el));
  }

  function setPlayerPosExp(el) {
    dispatch(setPlayerPos(el));
  }

  showStats = showStatsExp;
  setGameStats = setGameStatsExp;
  dispatchPlayerList = setPlayerListExp;
  dispatchPlayerPos = setPlayerPosExp;

  function callbackFn(e) {
    handleFile(e);
  }

  function handleChange(e) {

    $(function () {

      $('.roomlist-view').animate({
        left: '-150%',
      }, { duration: 700, easing: 'swing', queue: false });

      $('#loading-screen').animate({
        left: '35vw',
      }, { duration: 700, easing: 'swing', queue: false, complete: function () { callbackFn(e) } });

    })

  }

  function handleMultipleFiles(e) {
    let files = e.target.files
    files.forEach((file) => {
      handleFile(file)
      console.log("finished a file")
    })
    console.log("finished all files")
  }

  return (
    <>
      <div className='roomlist-view' style={{ zIndex: 5 }}>
        <div className='dialog'>
          <div className='file-btn'>
            <label htmlFor='replayfile'>
              <span style={{ float: 'left' }}>►</span>
              <span style={{ float: 'center' }}>Load SINGLE replay</span>
            </label>
            <input id='replayfile' type='file' accept='.hbr2' data-hook='replayfile' onChange={handleChange} />
          </div>

          <div className='file-btn'>
            <label htmlFor='replayfile2'>
              <span style={{ float: 'left' }}>►</span>
              <span style={{ float: 'center' }}>Load MULTIPLE replay</span>
            </label>
            <input id='replayfile2' type='file' accept='.hbr2' data-hook='replayfile2' multiple={true} onChange={handleMultipleFiles} />
          </div>
        </div>
      </div>
      <LoadingScreen />
      {mainMode === 'stats' && <GameStats />}
    </>
  );
}

export default Home;