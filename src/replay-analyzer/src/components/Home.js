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
  getBinaries,
  getGames,
  getPlayerGameStats,
  getPlayers,
  getPseudonyms, saveBinaryFile,
  saveGame,
  savePlayerGameStats, updateGame, updateGames,
  updatePlayer,
  updatePlayerElo
} from "../../../client/services/api";
import toastr from "toastr";
import {ELO_VOLATILITY} from "../../../client/constants/pages";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import playerStats from "./game stats/PlayerStats";

var _ = require('lodash');
// const bytea = require('postgres-bytea')

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

  async function handleBinaryChange(e) {
    let file = document.querySelector("#replayfile3").files[0];

    let reader = new FileReader;
    reader.onload = async function () {
      console.log(reader.result)
      let encodedString = encodeBinary(reader.result)
      console.log(encodedString)
      await saveBinaryFile(encodedString, file.name)
    };
    reader.readAsBinaryString(file)

  }

  function encodeBinary(binary) {
    return '\\x' + binary.split("")
        .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("");
  }

  function bufferToHex(buffer) {
    return Buffer.from(buffer.data).toString('hex')
  }

  function decodeBinary(binary) {
    let hex = bufferToHex(binary)
    console.log(hex)
    let decoded = hex.split(/(\w\w)/g)
        .filter(p => !!p)
        .map(c => String.fromCharCode(parseInt(c, 16)))
        .join("")
    console.log(decoded)
  }


  function saveDecodedFile(decoded) {
    let file = new Blob([decoded], {type: "application/octet-stream"});
    console.log(file)
    if (window.navigator.msSaveOrOpenBlob) {// IE10+
      window.navigator.msSaveOrOpenBlob(file, "filename");
    } else { // Others
      var a = document.createElement("a"),
          url = URL.createObjectURL(file);
      a.href = url;
      a.download = "filename";
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  function loadBinaryFile() {
    getBinaries().then(res => {
      let binary = res.data[1].file
      decodeBinary(binary)
    })
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

          <div className='file-btn2'>
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
          { process.env.NODE_ENV === 'development' ?
              <div>
                <button type="button" onClick={() => calculateWeights()}>
                  Calculate weights
                </button>
              </div> : null}
          { process.env.NODE_ENV === 'development' ?
              <div className='file-btn'>
                <label htmlFor='replayfile3'>
                  <span style={{ float: 'left' }}>►</span>
                  <span style={{ float: 'center' }}>Test binary post</span>
                </label>
                <input id='replayfile3' type='file' accept='.hbr2' data-hook='replayfile3' onChange={handleBinaryChange} />
              </div> : null}
          { process.env.NODE_ENV === 'development' ?
              <div>
                <button type="button" onClick={() => loadBinaryFile()}>
                  Load Binary File
                </button>
              </div> : null
          }
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
  console.log(games)
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
      if (player.kicks < 3) {
        game.redTeam = game.redTeam.filter(nick => nick !== player.nick)
        game.blueTeam = game.blueTeam.filter(nick => nick !== player.nick)
      }
    })
    playerStats = playerStats.filter(player => player.kicks >= 3)

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

    for (let i = 0; i < playerStats.length; i++) {
      playerStats[i] = {
        player_id: playerStats[i].id,
        goals: playerStats[i].goals,
        assists: playerStats[i].assists,
        kicks: playerStats[i].kicks,
        passes: playerStats[i].passes,
        shots_on_goal: playerStats[i].shots,
        own_goals: playerStats[i].ownGoals,
        won: playerStats[i].won
      }
    }

    if (checkGameValidity(cleanGame)) {
      // need to augment game with other stats in here
      augmentGame(playerStats, cleanGame)
      setPlayersElo(cleanGame)
      await saveGame(cleanGame).then(async (result) => {
        let gameId = result[0].id
        await savePlayerStats(gameId, playerStats)
        toastr.success(`Saved Game ${i}`)
        i++
      }).catch((err) => {
        // TODO: make specific error for duplicate games
        console.log(err)
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
      //TODO notify if doesn't exist in pseuds
      console.log("Unrecognized player name")
      toastr.error("Unrecognized player name")
      homeInstance.openConfirmModal()
    }
  })
  return listOfIds.sort()
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

async function savePlayerStats(gameId, playerStats) {
  for (const player of playerStats) {
    player.game_id = gameId

    await savePlayerGameStats(player).catch((err) => console.log(err))

    let oldPlayer = dbPlayers[player.player_id]
    oldPlayer.games_played += 1
    oldPlayer.games_won = player.won ? oldPlayer.games_won + 1 : oldPlayer.games_won
    oldPlayer.goals += player.goals
    oldPlayer.assists += player.assists
    oldPlayer.kicks += player.kicks
    oldPlayer.passes += player.passes
    oldPlayer.shots_on_goal += player.shots_on_goal
    oldPlayer.own_goals += player.own_goals
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
    await updatePlayer(updatedPlayer, player.player_id).catch((err) => console.log(err))
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
      let prOwnGoals = game.own_goals[pr.nick] === undefined ? 0 : game.own_goals[pr.nick]
      const plyr = {
        id: pr.id, nick: pr.nick, goals: prGoals, assists: prAssists, kicks: prKicks, passes: prPasses, shots: prShots, won: won, ownGoals: prOwnGoals
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
  let weights = {
    kicks: -2,
    possession: 1.5,
    passes: 0,
    shots_on_goal: 1,
    own_goals: -0.69
  }
  eloAlgorithm(game, weights)
}

// Classical chess elo adjusted to distribute elo based on each players elo vs the average elo of the opposing team
// Additionally adjusts elo based on score differential and uses a predictive model to give the "better" team an elo boost.
function eloAlgorithm(game, weights) {
  let changes = []
  let predictionValue = getPredictedWinner(weights, game.winnerStats)
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

    let eloGain = ELO_VOLATILITY * (1 - e1)

    // Adjust individual elo gain based on predicted result
    eloGain += predictionValue * 5
    // Adjust individual elo gain based on score only if it's a first to 3
    if (Math.max(game.red_score, game.blue_score) === 3) {
      eloGain = adjustEloBasedOnScore(eloGain, Math.min(game.red_score, game.blue_score))
    }
    eloGain = Math.round(eloGain)
    changes.push(eloGain)
    individualElo = individualElo + eloGain

    dbPlayers[winner].elo = individualElo
  }
  for (let i = 0; i < losers.length; i++) {
    let loser = losers[i]
    let oppositionElo = winnerStr === "red" ? redTeamAverage : blueTeamAverage
    let individualElo = dbPlayers[loser].elo
    let r1 = Math.pow(10, individualElo / 400)
    let r2 = Math.pow(10, oppositionElo / 400)
    let e2 = r2 / (r1 + r2)

    let eloLoss = (ELO_VOLATILITY * (1 - e2))

    // Adjust individual elo gain based on predicted result
    eloLoss += predictionValue * 5
    // Adjust individual elo loss based on score only if it's a first to 3
    if (Math.max(game.red_score, game.blue_score) === 3) {
      eloLoss = adjustEloBasedOnScore(eloLoss, Math.min(game.red_score, game.blue_score))
    }
    eloLoss = Math.round(eloLoss)
    changes.push(eloLoss)
    individualElo = individualElo - eloLoss

    dbPlayers[loser].elo = individualElo
  }
  game.elo_change = changes
  return predictionValue > 0
}

function adjustEloBasedOnScore(elo, loserScore) {
  if (loserScore === 0) {
    return elo * 1.2
  } else if (loserScore === 1) {
    return elo
  } else {
    return elo * 0.8
  }
}

async function recalculateElo() {

  let weights = {
    kicks: -2,
    possession: 1.5,
    passes: 0,
    shots_on_goal: 1,
    own_goals: -0.69
  }
  getPlayers().then(res => {
    dbPlayers = createPlayersMap(res.data)
    for (let i = 1; i <= _.size(dbPlayers); i++) {
      let player = dbPlayers[i]
      player.elo = 1000
    }
    getGames().then(async res => {
      let games = res.data.sort((g1, g2) => {
        return (g1.id - g2.id)
      })
      await getPlayerGameStats().then(async res => {
        games = augmentGames(res.data, games);
        let correctPredictions = 0
        for (const game of games) {
          let predictionResult = eloAlgorithm(game, weights)
          if (predictionResult) {
            correctPredictions += 1
          }
        }
        await pushEloToDatabase(games)
        console.log(correctPredictions)
        console.log(dbPlayers)
      })
    })
  })
}

async function pushEloToDatabase(games) {
  for (let i = 0; i < games.length; i++) {
    games[i] = {
      id: games[i].id,
      elo_change: games[i].elo_change,
    }
  }
  for (let game of games) {
    await updateGames(game)
  }
  for (let i = 1; i <= _.size(dbPlayers); i++) {
    const player = dbPlayers[i]
    await updatePlayerElo(player.elo, player.id)
  }
}

function getPredictedWinner(weights, stats) {
  let prediction = 0
  prediction += (stats.kicks * weights.kicks)
  prediction += (stats.passes * weights.passes)
  prediction += (stats.shots_on_goal * weights.shots_on_goal)
  prediction += (stats.possession * weights.possession)
  prediction += (stats.own_goals * weights.own_goals)
  return prediction
}

function augmentGames(playerStats, games) {
  // for each game, compile the associated player-game rows into relevant data
  // e.g difference in kicks, difference in possession, etc
  for (const game of games) {
    augmentGame(playerStats, game)
  }
  return games
}

function augmentGame(gameStats, game) {
  // statsObject represents the fraction of parameters the winning team has vs the losing team
  let winnerStatsObject = {
    kicks: 0,
    possession: 0,
    passes: 0,
    shots_on_goal: 0,
    own_goals: 0
  }
  let totalStatsObject = {
    kicks: 0,
    possession: 0,
    passes: 0,
    shots_on_goal: 0,
    own_goals: 0
  }
  let players = game.red_team.concat(game.blue_team)
  for (const player of players) {
    let stats = gameStats.filter(stat => stat.player_id === player && stat.game_id === game.id)[0]
    if (stats.won) {
      winnerStatsObject.kicks += stats.kicks
      winnerStatsObject.possession += stats.possession
      winnerStatsObject.passes += stats.passes
      winnerStatsObject.shots_on_goal += stats.shots_on_goal
      winnerStatsObject.own_goals += stats.own_goals
    }
    totalStatsObject.kicks += stats.kicks
    totalStatsObject.possession += stats.possession
    totalStatsObject.passes += stats.passes
    totalStatsObject.shots_on_goal += stats.shots_on_goal
    totalStatsObject.own_goals += stats.own_goals
  }
  game.winnerStats = {
    kicks: totalStatsObject.kicks === 0 ? 0 :
        (winnerStatsObject.kicks / totalStatsObject.kicks) - (1 - (winnerStatsObject.kicks / totalStatsObject.kicks)),
    possession: game.red_score > game.blue_score ? (game.red_possession - game.blue_possession) / 100 : (game.blue_possession - game.red_possession) / 100,
    passes: totalStatsObject.passes === 0 ? 0 :
        (winnerStatsObject.passes / totalStatsObject.passes) - (1 - (winnerStatsObject.passes / totalStatsObject.passes)),
    shots_on_goal: totalStatsObject.shots_on_goal === 0 ? 0 :
        (winnerStatsObject.shots_on_goal / totalStatsObject.shots_on_goal) - (1 - (winnerStatsObject.shots_on_goal / totalStatsObject.shots_on_goal)),
    own_goals: totalStatsObject.own_goals === 0 ? 0 :
        (winnerStatsObject.own_goals / totalStatsObject.own_goals) - (1 - (winnerStatsObject.own_goals / totalStatsObject.own_goals))
  }
}

async function calculateWeights() {

  let possibleWeights = [ -2, 1.5, 0, 1, -2.5, -1.27, 4.7, 3, -0.69, -3.5, -3, -1.5, -1, 0.5, 2, 2.5, 3.5, 4]

  // get games and player-game-stats for each of those games
  console.log("Calculate weights")
  getPlayers().then(res => {
    dbPlayers = createPlayersMap(res.data)
    for (let i = 1; i <= _.size(dbPlayers); i++) {
      let player = dbPlayers[i]
      player.elo = 1000
    }
    let ogPlayers = JSON.parse(JSON.stringify(dbPlayers))
    getGames().then(async res => {
      console.log("Got games")
      let games = res.data
      await getPlayerGameStats().then(res => {
        games = augmentGames(res.data, games);
      })
      let mostPredicted = 0
      let bestWeights = null
      console.log(possibleWeights)
      console.log(games)
      for (let i = 0; i < possibleWeights.length; i++) {
        for (let j = 0; j < possibleWeights.length; j++) {
          for (let k = 0; k < possibleWeights.length; k++) {
            for (let l = 0; l < possibleWeights.length; l++) {
              for (let m = 0; m < possibleWeights.length; m++) {
                dbPlayers = JSON.parse(JSON.stringify(ogPlayers))
                let weights = {
                  kicks: possibleWeights[i],
                  possession: possibleWeights[j],
                  passes: possibleWeights[k],
                  shots_on_goal: possibleWeights[l],
                  own_goals: possibleWeights[m]
                }
                let numberPredicted = 0
                for (const game of res.data) {
                  let correctPrediction = eloAlgorithm(game, weights)
                  if (correctPrediction) {
                    numberPredicted++
                  }
                }
                if (numberPredicted > mostPredicted) {
                  mostPredicted = numberPredicted
                  bestWeights = weights
                }
              }
            }
          }
        }
      }

      // TODO - use this at line 293 when model is finalized
      // let weights = {
      //               kicks: -2,
      //               possession: 1.5,
      //               passes: 0,
      //               shots_on_goal: 1,
      //               own_goals: -0.69
      //             }
      //           for (const game of res.data) {
      //             eloAlgorithm(game, weights)
      //           }


      console.log(`Most predicted = ${mostPredicted}`)
      console.log(bestWeights)
      console.log(dbPlayers)
     })
  })
}