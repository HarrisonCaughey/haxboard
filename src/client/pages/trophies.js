import React from "react";
import {Form} from "react-bootstrap";
import {getGames, getPlayers} from "../services/api";
import {DataGrid} from '@mui/x-data-grid';
import {
    Box, Button,
    Card, CardContent,
    Divider,
    FormControl,
    FormGroup,
    FormHelperText,
    Grid,
    IconButton,
    MenuItem,
    Select, Typography
} from "@mui/material";
import $ from "jquery";
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import {GridNoResultsOverlay} from "@mui/x-data-grid/components/GridNoResultsOverlay";


export class Trophies extends React.Component {

    constructor(props) {
        super(props);
        this.openConfirmModal = this.openConfirmModal.bind(this)
        this.getTeamNames = this.getTeamNames.bind(this)
        this.setStartDate = this.setStartDate.bind(this)
        this.setEndDate = this.setEndDate.bind(this)
        this.calculateStats = this.calculateStats.bind(this)
        this.augmentPlayers = this.augmentPlayers.bind(this)

        this.state = {
            games: [],
            filteredGames: [],
            players: null,
            team1: [],
            team2: [],
            team1Relation: "has exactly",
            team2Relation: "contains",
            startDate: null,
            endDate: null,
            wlr: 0,
            totalGames: 0,
            totalGoals: [0, 0],
            totalGameTime: 0,
            columns: [
                {
                    field: 'date',
                    headerName: 'Date',
                    width: 100,
                    sortable: true,
                    sortingOrder: ['desc', 'asc'],
                    valueGetter: (params) => ({
                            date: params.row.date,
                            id: params.id
                        }),
                    valueFormatter: (params) => {
                        return params.value.date
                    },
                    sortComparator: this.dateComparator
                },
                { field: 'game_time', headerName: 'Length', width: 70, sortable: true, sortingOrder: ['desc', 'asc'] },
                {
                    field: 'red_team_names',
                    headerName: 'Red Team',
                    width: 200,
                    sortable: false,
                    sortingOrder: ['desc', 'asc'],
                    valueGetter: (params) =>
                        `${this.getTeamNames(params.row.red_team_names)}`,
                    cellClassName: (params) => {
                        return params.row.red_score > params.row.blue_score ? "glowing-cell" : null
                    }
                },
                {
                    field: 'blue_team_names',
                    headerName: 'Blue Team',
                    width: 200,
                    sortable: false,
                     sortingOrder: ['desc', 'asc'],
                    valueGetter: (params) =>
                        `${this.getTeamNames(params.row.blue_team_names)}`,
                    cellClassName: (params) => {
                        return params.row.blue_score > params.row.red_score ? "glowing-cell" : null
                    }
                },
                { field: 'red_possession', headerName: 'R%', width: 40, sortable: true, sortingOrder: ['desc', 'asc'] },
                { field: 'red_score', headerName: 'R', width: 20, sortable: false },
                { field: 'blue_score', headerName: 'B', width: 20, sortable: false },
                { field: 'blue_possession', headerName: 'B%', width: 40, sortable: true, sortingOrder: ['desc', 'asc'] },
            ]
        }
    }

    componentDidMount() {
        getPlayers().then((players) => {
            this.setState({ players: players.data });
            console.log(JSON.parse(JSON.stringify(this.state.players)))
            getGames().then(res => {
                let games = res.data
                games.forEach((game) => {
                    game.date = game.date.slice(0, 10)
                    game.og_game_time = game.game_time
                    game.game_time = this.parseTime(game.game_time)
                    game.red_team_names = game.red_team.map((player) => player =
                       this.state.players.filter(player1 => player1.id === player)[0].name
                        )
                    game.blue_team_names = game.blue_team.map((player) => player =
                        this.state.players.filter(player1 => player1.id === player)[0].name
                        )
                })
                let filteredGames = games.sort((g1, g2) => {
                    return (g1.id - g2.id)
                })
                this.setState({ games: games, filteredGames: filteredGames });
                console.log(this.state.filteredGames[0])
                console.log(this.state.filteredGames)

                let elo = 1000
                let wins = 0
                let losses = 0
                for (let game of games) {
                    let winners = game.red_score > game.blue_score ? game.red_team : game.blue_team
                    let losers = game.red_score < game.blue_score ? game.red_team : game.blue_team
                    let winner = winners.filter(winner => winner === 1)
                    let loser = losers.filter(loser => loser === 1)
                    console.log(winner)
                    if (winner.length !== 0) {
                        elo += game.elo_change
                        wins++
                    } else if (loser.length !== 0) {
                        elo -= game.elo_change
                        losses++
                    }
                }
                console.log(elo)
                console.log(wins)
                console.log(losses)

                //this.calculateStats()
            })
        })
    }

    dateComparator = (v1, v2, param1, param2) => param1.id - param2.id

    getTeamNames(members) {
        let names = ''
        for (let member of members) {
            names += member + ', '
        }
        return names.slice(0, -2)
    }

    parseTime(gt) {
        var mins = Math.floor(gt / 60);
        gt -= mins * 60;
        if (gt < 10) gt = "0" + gt;
        return "" + mins + ":" + gt;
    }

    openConfirmModal() {
        $('#confirmModal').addClass('is-active');
    }


    setStartDate(event) {
        this.setState({startDate: event})
    }

    setEndDate(event) {
        this.setState({endDate: event})
    }

    augmentPlayers() {
        let players = this.state.players
        for (let i = 0; i < players.length; i++) {
            let player = players[i]
            player.max_elo = 1000
            player.winning_streak = 0
            player.current_winning_streak = 0
            player.losing_streak = 0
            player.current_losing_streak = 0
            player.first_place_streak = 0
            player.current_first_place_streak = 0
            player.lowest_elo = 1000
            player.current_lowest_elo = 1000
            player.elo = 1000
        }
        console.log(JSON.parse(JSON.stringify(this.state.players)))
    }

    calculateStats() {
        /*
        * Highest ever elo
        * Most games in #1 place (elo)
        * Longest win streak
        * Lowest ever elo
        * Best kick/goal ratio
        * Highest win/rate teams
         */
        this.augmentPlayers()

        let currentNumberOne = null

        // Loop through all games, adding/subtracting elo from scratch to calculate stats
        for (let game of this.state.filteredGames) {
            let winners = game.red_score > game.blue_score ? game.red_team : game.blue_team
            let losers = game.red_score < game.blue_score ? game.red_team : game.blue_team
            let players = game.red_team.concat(game.blue_team)
            for (let i = 0; i < winners.length; i++) {
                let winner = this.state.players.filter(player => player.id === winners[i])[0]
                winner.elo += game.elo_change
                winner.current_losing_streak = 0
                winner.current_winning_streak += 1
                if (winner.current_winning_streak > winner.winning_streak) {
                    winner.winning_streak = winner.current_winning_streak
                }

            }
            for (let i = 0; i < losers.length; i++) {
                let loser = this.state.players.filter(player => player.id === losers[i])[0]
                loser.elo -= game.elo_change
                loser.current_winning_streak = 0
                loser.current_losing_streak += 1
                if (loser.current_losing_streak > loser.losing_streak) {
                    loser.losing_streak = loser.current_losing_streak
                }
            }
            let maxElo = Math.max(...this.state.players.map(player => player.elo))
            for (let i = 0; i < players.length; i++) {
                let player = this.state.players.filter(player => player.id === player[i])[0]

            }

        }
        console.log(this.state.players)
    }

    render() {
        return (
            <div>
                <Box sx={{
                    "& .MuiFormGroup-root":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                }}>
                    <FormGroup
                        sx={{
                            p: 2,
                            m: 5,
                            boxShadow: 10,
                            display: "flex"
                        }}
                        row={true}
                    >

                    </FormGroup>
                </Box>
            </div>
        )
    }
}


class ConfirmModal extends React.Component {

    constructor(props) {
        super(props);
        this.closeModal = this.closeModal.bind(this);
        this.confirm = this.confirm.bind(this);
    }

    confirm() {
        this.props.handleClick()
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