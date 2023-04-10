import React from "react";
import {Form} from "react-bootstrap";
import {getGames, getPlayers} from "../services/api";
import {DataGrid} from '@mui/x-data-grid';
import {
    Avatar,
    Box, Button,
    Container,
    Card, CardContent,
    Divider,
    FormControl,
    FormGroup,
    FormHelperText,
    Grid,
    IconButton,
    MenuItem,
    Select, Stack, Tab, Tabs, Typography, Icon
} from "@mui/material";
import $ from "jquery";
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import {GridNoResultsOverlay} from "@mui/x-data-grid/components/GridNoResultsOverlay";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faCrown } from '@fortawesome/free-solid-svg-icons'


export class Trophies extends React.Component {

    constructor(props) {
        super(props);
        this.openConfirmModal = this.openConfirmModal.bind(this)
        this.getTeamNames = this.getTeamNames.bind(this)
        this.getTeamNames2 = this.getTeamNames2.bind(this)
        this.setStartDate = this.setStartDate.bind(this)
        this.setEndDate = this.setEndDate.bind(this)
        this.calculateStats = this.calculateStats.bind(this)
        this.augmentPlayers = this.augmentPlayers.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.attachImages = this.attachImages.bind(this)
        this.getSortedPlayers = this.getSortedPlayers.bind(this)
        this.getWinLossRatio = this.getWinLossRatio.bind(this)
        this.cleanTeams = this.cleanTeams.bind(this)

        this.state = {
            games: [],
            filteredGames: [],
            players: null,
            startDate: null,
            endDate: null,
            teams: null,
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
            ],
            selectedTab: 0,
            doneComputing: false,
        }
    }

    componentDidMount() {
        getPlayers().then((players) => {
            this.setState({ players: players.data });
            getGames().then(async res => {
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
                this.setState({games: games, filteredGames: filteredGames});

                this.calculateStats(filteredGames)
                this.attachImages(this.state.players)
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

    getTeamNames2(team) {
        let members = team.members.split('')
        let player1 = this.state.players.filter(player => player.id === parseInt(members[0]))[0]
        let player2 = this.state.players.filter(player => player.id === parseInt(members[1]))[0]
        return `${player1.name} - ${player2.name}`
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

    attachImages(players) {
        for (let player of players) {
            player.image = `${player.name.toLowerCase()}.png`
        }
        this.setState({players: players})
    }

    augmentPlayers() {
        let players = this.state.players
        for (let i = 0; i < players.length; i++) {
            let player = players[i]
            player.max_elo = 1000
            player.lowest_elo = 1000
            player.elo = 1000
            player.winning_streak = 0
            player.current_winning_streak = 0
            player.losing_streak = 0
            player.current_losing_streak = 0
            player.max_first_place_streak = 0
            player.current_first_place_streak = 0
        }
    }

    getSortedPlayers(sortBy, desc) {
        let players = this.state.players
        let sortedPlayers = players.sort((g1, g2) => {
            if (desc) {
                return (g2[sortBy] - g1[sortBy])
            } else {
                return (g1[sortBy] - g2[sortBy])
            }
        })
        return sortedPlayers
    }

    calculateStats(games) {
        /*
        * Highest ever elo
        * Most games in #1 place (elo)
        * Longest win streak
        * Lowest ever elo
        * Best kick/goal ratio
        * Highest win/rate teams
         */
        this.augmentPlayers()
        let teams = {
            "12" : {
                wins: 0,
                total: 0
            },
            "13" : {
                wins: 0,
                total: 0
            },
            "14" : {
                wins: 0,
                total: 0
            },
            "15" : {
                wins: 0,
                total: 0
            },
            "23" : {
                wins: 0,
                total: 0
            },
            "24" : {
                wins: 0,
                total: 0
            },
            "25" : {
                wins: 0,
                total: 0
            },
            "34" : {
                wins: 0,
                total: 0
            },
            "35" : {
                wins: 0,
                total: 0
            },
            "45" : {
                wins: 0,
                total: 0
            },
        }

        // Loop through all games, adding/subtracting elo from scratch to calculate stats
        for (let game of games) {
            let winners = game.red_score > game.blue_score ? game.red_team.sort() : game.blue_team.sort()
            let losers = game.red_score < game.blue_score ? game.red_team.sort() : game.blue_team.sort()

            if (teams[winners.join('')]) {
                teams[winners.join('')].wins++
                teams[winners.join('')].total++
            }
            if (teams[losers.join('')]) {
                teams[losers.join('')].total++
            }

            for (let i = 0; i < winners.length; i++) {
                let winner = this.state.players.filter(player => player.id === winners[i])[0]
                winner.elo += game.elo_change[i]
                winner.current_losing_streak = 0
                winner.current_winning_streak += 1
                if (winner.current_winning_streak > winner.winning_streak) {
                    winner.winning_streak = winner.current_winning_streak
                }
                if (winner.elo > winner.max_elo) {
                    winner.max_elo = winner.elo
                }

            }
            for (let i = 0; i < losers.length; i++) {
                let loser = this.state.players.filter(player => player.id === losers[i])[0]
                loser.elo -= game.elo_change[i + game.elo_change.length / 2]
                loser.current_winning_streak = 0
                loser.current_losing_streak += 1
                if (loser.current_losing_streak > loser.losing_streak) {
                    loser.losing_streak = loser.current_losing_streak
                }
                if (loser.elo < loser.lowest_elo) {
                    loser.lowest_elo = loser.elo
                }
            }
            let maxElo = Math.max(...this.state.players.map(player => player.elo))

            for (let i = 0; i < this.state.players.length; i++) {
                let player = this.state.players[i]
                if (player.elo === maxElo) {
                    player.current_first_place_streak += 1
                    if (player.current_first_place_streak > player.max_first_place_streak) {
                        player.max_first_place_streak = player.current_first_place_streak
                    }
                } else {
                    player.current_first_place_streak = 0
                }
            }
        }
        let arrayedTeams = this.cleanTeams(teams)
        this.setState({teams: arrayedTeams, doneComputing: true})
    }

    cleanTeams(teams) {
        let arrayedTeams = []
        for (let key in teams) {
            let team = teams[key]
            team.wlr = this.getWinLossRatio(team.wins, team.total)
            team.members = key
            let members = team.members.split('')
            let player1 = this.state.players.filter(player => player.id === parseInt(members[0]))[0]
            let player2 = this.state.players.filter(player => player.id === parseInt(members[1]))[0]
            team.memberNames = [player1.name, player2.name]
            team.image1 = player1.image
            team.image2 = player2.image
            arrayedTeams.push(team)
        }
        arrayedTeams = arrayedTeams.sort((g1, g2) => {
            return (g2.wlr - g1.wlr)
        })
        return arrayedTeams
    }

    getWinLossRatio(won, played) {
        let wlr = 0
        if (won !== 0) {
            wlr = (100 * won) / (played)
        }
        return wlr.toFixed(2)
    }

    handleChange(e) {
        console.log(e)
    }

    render() {
        return (
            <div style={{paddingTop: 10}}>
                <Box sx={{
                    paddingBottom: '5%',
                    paddingLeft: '2%',
                    paddingRight: '2%',
                    "& .MuiGrid-item":  {
                        backgroundColor: "rgba(250, 250, 250, .3)",
                        margin: 5,
                        boxShadow: 10,
                        height: 660, overflow: 'auto', maxWidth: 240, minWidth: 240,
                        textAlign: 'center'
                    },
                }}>
                    <FormGroup
                        sx={{
                            height: '100vh',
                        }}
                        row={true}
                    >
                        <Grid container rowSpacing={1} columnSpacing={{ xs: 2, sm: 2, md: 3 }} columns={18}>
                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={5} flexDirection="row">
                                <Typography sx={{ fontSize: 16 }} color="text.primary" gutterBottom>
                                    Current Elo
                                </Typography>
                                <Container
                                    style={{ marginTop: 100,}}
                                    className="container"
                                    sx={{
                                        padding: 2,
                                        width: '200px',
                                        height: 640, overflow: 'auto'
                                    }}
                                >
                                    {this.state.doneComputing ? this.getSortedPlayers('elo', true).map((item, index) => (
                                        <div key={index}>
                                            <div
                                                className="row"
                                                style={{
                                                    alignItems: "center",
                                                    marginTop: 20,
                                                    marginBottom: 0,
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={2}
                                                    style={{ alignItems: "center" }}
                                                >
                                                    <div style={{ color: "black" }}>{`${index +1}.`}</div>
                                                    <div>
                                                        {index === 0 ? <FontAwesomeIcon icon={faCrown} style={{color: "#f8f135",}} /> : null }
                                                        <Avatar src={item.image}/>
                                                    </div>

                                                    <Stack>
                                                        <div style={{ fontWeight: 500, color: "black" }}>{item.name}</div>
                                                    </Stack>
                                                </Stack>
                                                <div style={{ color: "black" }}>{item.elo}</div>
                                            </div>
                                            <Divider />
                                        </div>
                                    )) : null}
                                </Container>
                            </Grid>

                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={3} flexDirection="row">
                                <Typography sx={{ fontSize: 16 }} color="text.primary" gutterBottom>
                                    Highest Ever Elo
                                </Typography>
                                <Container
                                    style={{ marginTop: 100,}}
                                    className="container"
                                    sx={{
                                        padding: 2,
                                        width: '200px',
                                        height: 640, overflow: 'auto'
                                    }}
                                >
                                    {this.state.doneComputing ? this.getSortedPlayers('max_elo', true).map((item, index) => (
                                        <div key={index}>
                                            <div
                                                className="row"
                                                style={{
                                                    alignItems: "center",
                                                    marginTop: 20,
                                                    marginBottom: 0,
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={2}
                                                    style={{ alignItems: "center" }}
                                                >
                                                    <div style={{ color: "black" }}>{`${index +1}.`}</div>
                                                    <div>
                                                        {index === 0 ? <FontAwesomeIcon icon={faCrown} style={{color: "#f8f135",}} /> : null }
                                                        <Avatar src={item.image}/>
                                                    </div>

                                                    <Stack>
                                                        <div style={{ fontWeight: 500, color: "black" }}>{item.name}</div>
                                                    </Stack>
                                                </Stack>
                                                <div style={{ color: "black" }}>{item.max_elo}</div>
                                            </div>
                                            <Divider />
                                        </div>
                                    )) : null}
                                </Container>
                            </Grid>

                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={3} flexDirection="row">
                                <Typography sx={{ fontSize: 16 }} color="text.primary" gutterBottom>
                                    Highest Winning Streak
                                </Typography>
                                <Container
                                    style={{ marginTop: 100,}}
                                    className="container"
                                    sx={{
                                        padding: 2,
                                        width: '200px',
                                        height: 640, overflow: 'auto'
                                    }}
                                >
                                    {this.state.doneComputing ? this.getSortedPlayers('winning_streak', true).map((item, index) => (
                                        <div key={index}>
                                            <div
                                                className="row"
                                                style={{
                                                    alignItems: "center",
                                                    marginTop: 20,
                                                    marginBottom: 0,
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={2}
                                                    style={{ alignItems: "center" }}
                                                >
                                                    <div style={{ color: "black" }}>{`${index +1}.`}</div>
                                                    <div>
                                                        {index === 0 ? <FontAwesomeIcon icon={faCrown} style={{color: "#f8f135",}} /> : null }
                                                        <Avatar src={item.image}/>
                                                    </div>

                                                    <Stack>
                                                        <div style={{ fontWeight: 500, color: "black" }}>{item.name}</div>
                                                    </Stack>
                                                </Stack>
                                                <div style={{ color: "black" }}>{item.winning_streak}</div>
                                            </div>
                                            <Divider />
                                        </div>
                                    )) : null}
                                </Container>
                            </Grid>

                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={3} flexDirection="row">
                                <Typography sx={{ fontSize: 16 }} color="text.primary" gutterBottom>
                                    #1 Elo Streak
                                </Typography>
                                <Container
                                    style={{ marginTop: 100,}}
                                    className="container"
                                    sx={{
                                        padding: 2,
                                        width: '200px',
                                        height: 640, overflow: 'auto'
                                    }}
                                >
                                    {this.state.doneComputing ? this.getSortedPlayers('max_first_place_streak', true).map((item, index) => (
                                        <div key={index}>
                                            <div
                                                className="row"
                                                style={{
                                                    alignItems: "center",
                                                    marginTop: 20,
                                                    marginBottom: 0,
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={2}
                                                    style={{ alignItems: "center" }}
                                                >
                                                    <div style={{ color: "black" }}>{`${index +1}.`}</div>
                                                    <div>
                                                        {index === 0 ? <FontAwesomeIcon icon={faCrown} style={{color: "#f8f135",}} /> : null }
                                                        <Avatar src={item.image}/>
                                                    </div>
                                                    <Stack>
                                                        <div style={{ fontWeight: 500, color: "black" }}>{item.name}</div>
                                                    </Stack>
                                                </Stack>
                                                <div style={{ color: "black" }}>{item.max_first_place_streak}</div>
                                            </div>
                                            <Divider />
                                        </div>
                                    )) : null}
                                </Container>
                            </Grid>

                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={3} flexDirection="column">
                                <Typography sx={{ fontSize: 16, paddingBottom: 40 }} color="text.primary" gutterBottom>
                                    Top Teams
                                </Typography>
                                <Container
                                    style={{ marginTop: 100,}}
                                    className="container"
                                    sx={{
                                        padding: 2,
                                        width: '200px',
                                        height: 640, overflow: 'auto'
                                    }}
                                >
                                    {this.state.doneComputing ? this.state.teams.map((item, index) => (
                                        <div key={index}>
                                            <div
                                                className="row"
                                                style={{
                                                    alignItems: "center",
                                                    marginTop: 20,
                                                    marginBottom: 0,
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={2}
                                                    style={{ alignItems: "center" }}
                                                >
                                                    <div style={{ color: "black" }}>{`${index +1}.`}</div>
                                                    <div>
                                                        {index === 0 ? <FontAwesomeIcon icon={faCrown} style={{color: "#f8f135",}} /> : null }
                                                        <Avatar src={item.image1}/>
                                                    </div>
                                                    <div>
                                                        {index === 0 ? <FontAwesomeIcon icon={faCrown} style={{color: "#f8f135",}} /> : null }
                                                        <Avatar src={item.image2}/>
                                                    </div>
                                                    <Stack>
                                                    </Stack>
                                                </Stack>
                                                <div style={{ color: "black" }}>{`${item.wlr}%`}</div>
                                            </div>
                                            <Divider />
                                        </div>
                                    )) : null}
                                </Container>
                            </Grid>
                        </Grid>
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