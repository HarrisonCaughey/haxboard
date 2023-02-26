/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */

import $ from 'jquery'
import {handleFile, handleFiles} from "../game2.js";
import LoadingScreen from "./LoadingScreen";
import {useDispatch, useSelector} from "react-redux";
import {setMainMode} from "../slices/mainModeSlice";
import {setDivStyle, setPlayerList, setPlayerPos, setStats} from "../slices/gameStatsSlice";
import GameStats from "./game stats/GameStats";
import React, {useState} from "react";
import {
  getGames,
  getPlayers,
  getPseudonyms,
  saveGame,
  savePlayerGameStats,
  updatePlayer, updatePlayerElo
} from "../../../client/services/api";
import toastr from "toastr";
import {ELO_VOLATILITY} from "../../../client/constants/pages";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
var _ = require('lodash');

export function showStats() { }
export function setGameStats() { }
export function dispatchPlayerList() { }
export function dispatchPlayerPos() { }

let pseuds = null
let dbPlayers = null
let homeInstance = null

function Home() {

  const dispatch = useDispatch();
  const mainMode = useSelector((state) => state.mainMode.value);
  const version = useSelector((state) => state.mainMode.version);
  const [pseudonyms, setPseuds] = useState({});
  //const [dbPlayers, setDBPlayers] = useState({});
  const [showModal, setShowModal] = useState(false);

  // TODO saving home instance to global variable
  //   useEffect( () => {
  //     homeInstance = this
  //     console.log(homeInstance)
  //   }, []);




  var handleCloseModal = () => setShowModal(false);

  var handleSaveModal = () => {
    console.log("success");
  };

  const renderBackdrop = (props) => <div className="backdrop" {...props} />;

  async function setup() {
    await getPseudonyms().then((res) => {
      pseuds = createPseudsMap(res.data)
    })

    await getPlayers().then((res) => {
      dbPlayers = createPlayersMap(res.data)
    })
  }

  setup()
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
      $('.roomlist-view').animate({
        left: '-150%',
      }, { duration: 700, easing: 'swing', queue: false });

      $('#loading-screen').animate({
        left: '35vw',
      }, { duration: 700, easing: 'swing', queue: false, complete: function () { callbackFn(e) } });

    })

  }

  async function handleMultipleFiles(e) {
    let files = e.target.files
    await handleFiles(files)
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
          { process.env.NODE_ENV === 'development' ?
              <div>
                <button type="button" onClick={() => openConfirmModal()}>
                  Open Modal
                </button>
              </div> : null
          }
          { process.env.NODE_ENV === 'development' ?
            <div>
            <button type="button" onClick={() => recalculateElo()}>
            Recalculate Elo
            </button>
            </div> : null}
        </div>
      </div>
      <LoadingScreen />
      {mainMode === 'stats' && <GameStats />}
      <ConfirmModal pseuds={pseuds}/>
    </>
  );
}

class ConfirmModal extends React.Component {

  constructor(props) {
    super(props);
    this.closeModal = this.closeModal.bind(this);
    this.confirm = this.confirm.bind(this);
    this.state = {
      pseudValue: {label: 'Select an player', key: '01'},
      playerValue: {label: 'Select an option', key: '01'},
      pseudOptions: null,
      playerOptions: null
    }
  }

  async componentDidMount() {
    await getPseudonyms().then(async (res) => {
      pseuds = createPseudsMap(res.data)
      this.setState({
        pseudOptions: Object.entries(pseuds).map(object => object = {
          "value": object[0],
          "id": object[1],
          "label": object[0]
        })
      })
      await getPlayers().then((res) => {
        dbPlayers = createPlayersMap(res.data)
        this.setState({
          playerOptions: Object.entries(dbPlayers).map(object => object = {
            "value": object[0],
            "id": object[1],
            "label": object[0]
          })
        })
      })
    })
  }

  confirm() {
    console.log(pseuds)
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
        <section className="modal-card-body" style={{height: 300}}>
          {
              <Dropdown options={this.state.pseudOptions}
                        onChange={(value) => this.setState({value: value})}
                        value={this.state.value} placeholder="Select an option" />
          }
          {
            <Dropdown options={this.state.playerOptions}
                      onChange={(value) => this.setState({value: value})}
                      value={this.state.value} placeholder="Select an option" />
          }
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
  // TODO check if passing Home instance into non-react function is feasible
  // homeInstance.openConfirmModal()
  // Home().openConfirmModal()
  let binaryId = 1
  // saveBinaryFile(file).then ((res) => {
  //     binaryId = res.data
  // }).catch((error) => {
  //     console.log(error)
  // })
  //TODO POST FILE
  toastr.info("Processing games, please be patient")
  let i = 1
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
      await saveGame(cleanGame).then(async (result) => {
        let gameId = result[0].id
        setPlayersElo(cleanGame)
        await savePlayerStats(gameId, playerStats)
        toastr.success(`Saved Game ${i}`)
        i++
      }).catch((err) => {
        // TODO: make specific error for duplicate games
        toastr.error(`Failed saving Game ${i}. It's probably a duplicate`)
        i++
      })
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
      homeInstance.openConfirmModal()
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

function calculateMvp() {
  return 0;
}

function calculateOwnGoals() {
  return 0;
}

async function savePlayerStats(gameId, playerStats) {
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

function setPlayersElo(game) {
  eloAlgorithm3(game)
}

// Classical chess elo adjusted distribute elo to team members based on their perceived contribution to the game
// ie. the higher elo player in a winning team gets a high proportion of elo (as the model expects they contributed more)
function eloAlgorithm1(game) {
  // TODO figure out why people are losing more elo than they're gaining
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
    individualElo = Math.round(individualElo + ELO_VOLATILITY * (1 - e1) * (individualElo / (winnerStr === "red" ? redTeamElo : blueTeamElo)))
    dbPlayers[winner].elo = individualElo
  }
  losers = losers.map(loser => loser = {id: loser, elo: dbPlayers[loser].elo})
  losers.sort(function (a, b) { return a.elo - b.elo })
  for (let i = 0; i < losers.length; i++) {
    let loser = losers[i]
    dbPlayers[loser.id].elo = Math.round(loser.elo - ELO_VOLATILITY * (1 - e2) * (losers.at((i + 1) * -1).elo / (winnerStr === "red" ? blueTeamElo : redTeamElo)))
  }
}

// Classical chess elo adjusted to distribute elo to team members evenly
// Net elo gain/loss is calculated on a team v team basis
function eloAlgorithm2(game) {
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
    individualElo = Math.round(individualElo + ((ELO_VOLATILITY * (1 - e1)) / winners.length))
    dbPlayers[winner].elo = individualElo
  }
  for (let i = 0; i < losers.length; i++) {
    let loser = losers[i]
    let individualElo = dbPlayers[loser].elo
    individualElo = Math.round(individualElo - ((ELO_VOLATILITY * (1 - e2)) / losers.length))
    dbPlayers[loser].elo = individualElo
  }
}

// Classical chess elo adjusted to distribute elo based on each players elo vs the average elo of the opposing team
function eloAlgorithm3(game) {
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
  let redTeamAverage = redTeamElo / game.red_team.length
  let blueTeamAverage = blueTeamElo / game.blue_team.length
  for (let i = 0; i < winners.length; i++) {
    let winner = winners[i]
    let oppositionElo = winnerStr === "blue" ? redTeamAverage : blueTeamAverage
    let individualElo = dbPlayers[winner].elo
    let r1 = Math.pow(10, individualElo / 400)
    let r2 = Math.pow(10, oppositionElo / 400)
    let e1 = r1 / (r1 + r2)
    individualElo = Math.round(individualElo + (ELO_VOLATILITY * (1 - e1)))
    dbPlayers[winner].elo = individualElo
  }
  for (let i = 0; i < losers.length; i++) {
    let loser = losers[i]
    let oppositionElo = winnerStr === "red" ? redTeamAverage : blueTeamAverage
    let individualElo = dbPlayers[loser].elo
    let r1 = Math.pow(10, individualElo / 400)
    let r2 = Math.pow(10, oppositionElo / 400)
    let e2 = r2 / (r1 + r2)
    individualElo = Math.round(individualElo - (ELO_VOLATILITY * (1 - e2)))
    dbPlayers[loser].elo = individualElo
  }
}

async function recalculateElo() {
  getPlayers().then(res => {
    dbPlayers = createPlayersMap(res.data)
    for (let i = 1; i <= _.size(dbPlayers); i++) {
      let player = dbPlayers[i]
      player.elo = 1000
    }
    getGames().then(async res => {
      for (const game of res.data) {
        eloAlgorithm3(game)
      }
      await pushEloToDatabase()
    })
  })
  console.log(dbPlayers)
}

async function pushEloToDatabase() {
  for (let i = 1; i <= _.size(dbPlayers); i++) {
    const player = dbPlayers[i]
    await updatePlayerElo(player.elo, player.id)
  }
}