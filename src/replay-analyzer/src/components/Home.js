import $ from 'jquery'
import { handleFile } from "../game2.js";
import LoadingScreen from "./LoadingScreen";
import { useSelector, useDispatch } from "react-redux";
import { setMainMode } from "../slices/mainModeSlice";
import { setDivStyle, setStats, setPlayerList, setPlayerPos } from "../slices/gameStatsSlice";
import GameStats from "./game stats/GameStats";
import React, {useState} from "react";
import {getPlayers, getPseudonyms, saveGame, savePlayerGameStats, updatePlayer} from "../../../client/services/api";
import toastr from "toastr";
import {ELO_VOLATILITY} from "../../../client/constants/pages";


export function showStats() { }
export function setGameStats() { }
export function dispatchPlayerList() { }
export function dispatchPlayerPos() { }

let pseuds = {}
let dbPlayers = {}
let pog = 0

function Home() {

  const dispatch = useDispatch();
  const mainMode = useSelector((state) => state.mainMode.value);
  const version = useSelector((state) => state.mainMode.version);
  const [pseudonyms, setPseuds] = useState({});
  const [dbPlayers, setDBPlayers] = useState({});
  const [showModal, setShowModal] = useState(false);

  var handleCloseModal = () => setShowModal(false);

  var handleSaveModal = () => {
    console.log("success");
  };

  const renderBackdrop = (props) => <div className="backdrop" {...props} />;


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
    handleFile(e.target.files[0]);
  }

  function handleChange(e) {

    $(function () {
      pog = 1
      console.log("pog " + pog)
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
    console.log(files)
    for (var j = 0; j < files.length; j++) {
      handleFile(files[j])
      setTimeout(function(){
        console.log("doing it")
      }, 5000);
      console.log("finished file")
    }
    console.log("finished all files")

  }

  function openConfirmModal() {
    $('#confirmModal').addClass('is-active');
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

          <div>
            <button type="button" onClick={() => openConfirmModal()}>
              Open Modal
            </button>
          </div>
          <p>Click to get the open the Modal</p>
        </div>
      </div>
      <LoadingScreen />
      {mainMode === 'stats' && <GameStats />}
      <ConfirmModal />
    </>
  );
}

class ConfirmModal extends React.Component {

  constructor(props) {
    super(props);
    this.closeModal = this.closeModal.bind(this);
    this.confirm = this.confirm.bind(this);
  }

  confirm() {
    this.props.handleDelete()
    this.closeModal()
  }

  closeModal() {
    $('#confirmModal').removeClass('is-active');
  }

  render() {
    return (<div id="confirmModal" className="modal">
      <div className="modal-background"/>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Confirmation</p>
        </header>
        <section className="modal-card-body">
          <p>Are you sure that you want to delete this game?</p>
        </section>
        <footer className="modal-card-foot">
          <a className="button is-warning" onClick={this.confirm}>Yes</a>
          <a className="button" onClick={this.closeModal}>No</a>
        </footer>
      </div>
    </div>);
  }
}

export default Home;

export async function saveGames(file, games) {

  console.log(games)
  let binaryId = 1
  // saveBinaryFile(file).then ((res) => {
  //     binaryId = res.data
  // }).catch((error) => {
  //     console.log(error)
  // })
  //TODO POST FILE
  await getPseudonyms().then((res) => {
    pseuds = createPseudsMap(res.data)
    console.log(pseuds)
  })

  await getPlayers().then((res) => {
    dbPlayers = createPlayersMap(res.data)
    console.log(dbPlayers)
  })

  for (const game of games) {
    let playerStats = processPlayerStats(game)

    //filter out from game and gamestats non-playing players  ////////////////////////////

    playerStats.forEach(player => {
      if (player.kicks < 5) {
        game.redTeam = game.redTeam.filter(nick => nick !== player.nick)
        game.blueTeam = game.blueTeam.filter(nick => nick !== player.nick)
      }
    })
    playerStats = playerStats.filter(player => player.kicks >= 5)

    ////////////////////////////////////////////////////////////////////////////////////

    let cleanGame = {
      red_score: game.scoreRed,
      blue_score: game.scoreBlue,
      red_possession: (game.possRed / (game.possRed + game.possBlue) * 100).toFixed(1),
      blue_possession: (game.possBlue / (game.possRed + game.possBlue) * 100).toFixed(1),
      game_time: (game.gameTicks / 60).toFixed(),
      red_team: getPseuds(game.redTeam),
      blue_team: getPseuds(game.blueTeam),
      date: getDateFromFile(file),
      binary_id: binaryId
    }

    if (checkGameValidity(cleanGame)) {
      let result = await saveGame(cleanGame).catch((err) => console.log(err))
      let gameId = result[0].id
      await savePlayerStats(gameId, playerStats)
      console.log("old player stats:")
      console.log(dbPlayers)
      setPlayersElo(cleanGame, playerStats)
      console.log("new old player stats:")
      console.log(dbPlayers)
      console.log(cleanGame)
      console.log(playerStats)
    }
  }
}

function getPseuds(listOfNicks) {
  let listOfIds = []
  listOfNicks.forEach(nick => {
    if (pseuds[nick] !== undefined) {
      listOfIds.push(pseuds[nick])
    } else {
      //TODO notify if doestn exist in pseuds
      console.log("Unrecognized player name")
      toastr.error("Unrecognized player name")
    }
  })
  return listOfIds
}


function getDateFromFile(file) {
  var fileName = file.name;
  return new Date(fileName.slice(fileName.indexOf("-")+1, fileName.lastIndexOf("-")));
}



function checkGameValidity(game) {
  // score check
  if (game.red_score === game.blue_score) return false;
  if (game.red_score < 3 && game.blue_score < 3) return false;
  if (game.red_score > 5 || game.blue_score > 5) return false;
  //player check
  if (game.red_team.length !== game.blue_team.length) return false;
  const playersPlayedList = game.red_team.concat(game.blue_team);
  const playersPlayedSet = new Set(playersPlayedList);
  if (playersPlayedList.length !== playersPlayedSet.size) return false;
  return true
}

function calculateElo() {
  return 0
}

function calculateMvp() {
  return 0;
}

function calculateOwnGoals() {
  return 0;
}

async function savePlayerStats(gameId, playerStats) {
  console.log("player stats " + playerStats)
  for (const player of playerStats) {
    let cleanPlayerGamestats = {
      game_id: gameId,
      player_id: player.id,
      goals: player.goals,
      assists: player.assists,
      kicks: player.kicks,
      passes: player.passes,
      shots_on_goal: player.shots,
      own_goals: 0,
      won: player.won
    }

    await savePlayerGameStats(cleanPlayerGamestats).catch((err) => console.log(err))

    let oldPlayer = dbPlayers[player.id]
    oldPlayer.games_played += 1
    oldPlayer.games_won = player.won ? oldPlayer.games_won + 1 : oldPlayer.games_won
    oldPlayer.goals += cleanPlayerGamestats.goals
    oldPlayer.assists += cleanPlayerGamestats.assists
    oldPlayer.kicks += cleanPlayerGamestats.kicks
    oldPlayer.passes += cleanPlayerGamestats.passes
    oldPlayer.shots_on_goal += cleanPlayerGamestats.shots_on_goal
    oldPlayer.own_goals += calculateOwnGoals()
    console.log("player " + player)
    console.log("oldPlayer " + oldPlayer)
    let updatedPlayer = {
      games_played: oldPlayer.games_played,
      games_won: oldPlayer.games_won,
      elo: oldPlayer.elo,
      mvps: oldPlayer.mvps,
      goals: oldPlayer.goals,
      assists: oldPlayer.assists,
      kicks: oldPlayer.kicks,
      passes: oldPlayer.passes,
      shots_on_goal: oldPlayer.shots_on_goal,
      own_goals: oldPlayer.own_goals
    }
    await updatePlayer(updatedPlayer, player.id).catch((err) => console.log(err))
  }
}

function processPlayerStats(game) {
  var gameStats = []
  for (var i = 0; i < game.player.length; i++) {
    game.player[i].id = pseuds[game.player[i].nick] ? pseuds[game.player[i].nick] : -1
    var pr = game.player[i], prGoals = 0, prAssists = 0, prKicks = 0, prPasses = 0, prShots = 0;

    for (var j = 0; j < game.goals.length; j++) {
      if (game.goals[j].scorer === pr.nick) prGoals++;
      else if (game.goals[j].assist === pr.nick) prAssists++;
    }
    for (var j = 0; j < game.kicks.length; j++) if (game.kicks[j] === pr.nick) prKicks++;
    for (var j = 0; j < game.passes.length; j++) if (game.passes[j] === pr.nick) prPasses++;
    for (var j = 0; j < game.shots.length; j++) if (game.shots[j] === pr.nick) prShots++;
    if (!game.spaceMode) {
      let won = true
      if (game.scoreRed > game.scoreBlue) {
        if (game.blueTeam.includes(pr.nick)) won = false;
      } else {
        if (game.redTeam.includes(pr.nick)) won = false;
      }
      const plyr = {
        id: pr.id, nick: pr.nick, goals: prGoals, assists: prAssists, kicks: prKicks, passes: prPasses, shots: prShots, won: won
      };
      gameStats.push(plyr);
    }
  }
  return gameStats
}

function createPseudsMap(data) {
  let map = {};
  data.forEach((pseud) => {
    map[pseud.pseudonym] = pseud.player_id
  })
  return map;
}

function createPlayersMap(data) {
  let map = {};
  data.forEach((player) => {
    map[player.id] = player
  })
  return map;
}

function handleFiles(files) {
  files.forEach((file) => {
    handleFile(file)
  })
}

function setPlayersElo(game, playerStats) {
  let winnerStr = game.red_score > game.blue_score ? "red" : "blue";
  let winners = winnerStr === "red" ? game.red_team : game.blue_team;
  let losers = winnerStr === "red" ? game.blue_team : game.red_team;
  let redTeamElo = 0;
  let blueTeamElo = 0;
  for (let i = 0; i < game.red_team.length; i++) {
    const id = game.red_team[i]
    redTeamElo += dbPlayers[id].elo
  }
  for (let i = 0; i < game.blue_team.length; i++) {
    const id = game.blue_team[i]
    blueTeamElo += dbPlayers[id].elo
  }
  let r1 = Math.pow(10, redTeamElo / 400)
  let r2 = Math.pow(10, blueTeamElo / 400)
  let e1 = r1 / (r1 + r2)
  let e2 = r2 / (r2 + r1)
  for (let i = 0; i < winners.length; i++) {
    let winner = winners[i]
    let individualElo = dbPlayers[winner].elo
    individualElo = parseInt(individualElo + ELO_VOLATILITY * (1 - e1) * (individualElo / (winnerStr === "red" ? redTeamElo : blueTeamElo)))
    dbPlayers[winner].elo = individualElo
  }
  for (let i = 0; i < losers.length; i++) {
    let loser = losers[i]
    let individualElo = dbPlayers[loser].elo
    individualElo = parseInt(individualElo - ELO_VOLATILITY * (1 - e2) * (individualElo / (winnerStr === "red" ? blueTeamElo : redTeamElo)))
    dbPlayers[loser].elo = individualElo
  }
}