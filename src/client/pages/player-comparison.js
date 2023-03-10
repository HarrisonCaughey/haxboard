import React from "react";
import {Form} from "react-bootstrap";
import {getGames, getPlayers} from "../services/api";
import {DataGrid} from '@mui/x-data-grid';
import {
    Box,
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


export class PlayerComparison extends React.Component {

    constructor(props) {
        super(props);
        this.openConfirmModal = this.openConfirmModal.bind(this)
        this.getTeamNames = this.getTeamNames.bind(this)
        this.handleClick = this.handleClick.bind(this)
        this.handleChangeTeam1 = this.handleChangeTeam1.bind(this)
        this.handleChangeTeam1Relations = this.handleChangeTeam1Relations.bind(this)
        this.handleChangeTeam2 = this.handleChangeTeam2.bind(this)
        this.handleChangeTeam2Relations = this.handleChangeTeam2Relations.bind(this)
        this.getStyles = this.getStyles.bind(this)
        this.filterGames = this.filterGames.bind(this)
        this.filterTeam1 = this.filterTeam1.bind(this)
        this.filterTeam2 = this.filterTeam2.bind(this)
        this.exactFilter = this.exactFilter.bind(this)
        this.containsFilter = this.containsFilter.bind(this)
        this.setStartDate = this.setStartDate.bind(this)
        this.setEndDate = this.setEndDate.bind(this)
        this.calculateStats = this.calculateStats.bind(this)
        this.filterDupesAndDates = this.filterDupesAndDates.bind(this)

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
                this.setState({ games: games, filteredGames: games });
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

    handleClick() {
        return null
    }

    setStartDate(event) {
        this.setState({startDate: event})
    }

    setEndDate(event) {
        this.setState({endDate: event})
    }

    async filterGames() {
        let games = this.state.games
        games = await this.filterDupesAndDates(games)
        if (this.state.team1.length !== 0) {
            games = this.filterTeam1(games)
        }
        if (this.state.team2.length !== 0) {
            games = this.filterTeam2(games)
        }
        await this.setState({filteredGames: games})

        this.calculateStats()
    }

    filterDupesAndDates(games) {
        games = games.filter(game => {
            // Date filter
            let startDate = this.state.startDate ? this.state.startDate.format('YYYY-MM-DD') : '0000-00-00'
            let endDate = this.state.endDate ? this.state.endDate.format('YYYY-MM-DD') : '9999-99-99'
            if (game.date < startDate || game.date > endDate) {
                return false
            }
            // If team1 contains members in both red and blue team then filter it out

            // Filter out any game where the red and blue teams don't contain all members from teams 1 and 2

            // For each player in team1, if that player is in either side, then return false if any other members of that team are on the other side
            // I also need to filter out games where any players from team2 are in team1
            for (let player of this.state.team1) {
                if (game.red_team_names.includes(player)) {
                    for (let player2 of this.state.team1) {
                        if (game.blue_team_names.includes(player2)) {
                            return false
                        }
                    }
                }
                if (game.blue_team_names.includes(player)) {
                    for (let player3 of this.state.team2) {
                        if (game.red_team_names.includes(player3)) {
                            return false
                        }
                    }
                } else if (game.blue_team_names.includes(player)) {
                    for (let player2 of this.state.team1) {
                        if (game.red_team_names.includes(player2)) {
                            return false
                        }
                    }

                    for (let player3 of this.state.team2) {
                        if (game.blue_team_names.includes(player3)) {
                            return false
                        }
                    }
                }
            }
            for (let player of this.state.team2) {
                if (game.red_team_names.includes(player)) {
                    for (let player2 of this.state.team2) {
                        if (game.blue_team_names.includes(player2)) {
                            return false
                        }
                    }
                    for (let player3 of this.state.team1) {
                        if (game.red_team_names.includes(player3)) {
                            return false
                        }
                    }
                }
                if (game.blue_team_names.includes(player)) {
                    for (let player2 of this.state.team2) {
                        if (game.red_team_names.includes(player2)) {
                            return false
                        }
                    }

                    for (let player3 of this.state.team1) {
                        if (game.blue_team_names.includes(player3)) {
                            return false
                        }
                    }
                }
            }
            return true
        })
        return games
    }

    calculateStats() {
        let team1Wins = 0
        let team2Wins = 0
        let team1Goals = 0
        let team2Goals = 0
        let totalGameTime = 0
        for (let game of this.state.filteredGames) {
            // Calculate game time
            totalGameTime += game.og_game_time
            for (let player of this.state.team1) {
                // Calculate losses
                if (game.red_team_names.includes(player)) {
                    team1Goals += game.red_score
                    team2Goals += game.blue_score
                } else {
                    team2Goals += game.red_score
                    team1Goals += game.blue_score
                }

                // Calculate wins
                let winningTeam = game.red_score > game.blue_score ?
                    game.red_team_names :
                    game.blue_team_names
                if (winningTeam.includes(player)) {
                    team1Wins++
                    break
                } else {
                    team2Wins++
                    break
                }
            }
        }
        let wlr
        if (team1Wins === 0) {
            wlr = 0
        }
        else if (team2Wins === 0) {
            wlr = 100
        } else {
            wlr = (100 * team1Wins / (team2Wins + team1Wins)).toFixed(1)
        }
        this.setState({
            wlr: wlr, totalGames: team1Wins + team2Wins, totalGoals: [team1Goals, team2Goals],
            totalGameTime: totalGameTime
        })
    }

    filterTeam1(games) {
        if (this.state.team1Relation === "contains") {
            return this.containsFilter(games, this.state.team1)
        } else {
            return this.exactFilter(games, this.state.team1)
        }
    }

    filterTeam2(games) {
        if (this.state.team2Relation === "contains") {
            return this.containsFilter(games, this.state.team2)
        } else {
            return this.exactFilter(games, this.state.team2)
        }
    }

    exactFilter(games, team) {
        team.sort()
        games = games.filter(game => {
            let r = game.red_team_names.sort()
            let b = game.blue_team_names.sort()
            return JSON.stringify(team) === JSON.stringify(r) || JSON.stringify(team) === JSON.stringify(b)
        })
        return games
    }

    containsFilter(games, team) {
        // check that every player in 'team' exists in either r or b
        games = games.filter(game => {
            for (let player of team) {
                // team = ["Harrison", "Martin"]
                // red_team = ["Martin", "Sam"]
                if (game.red_team_names.includes(player)) {
                    let truthy = true
                    for (let player2 of team) {
                        if (!game.red_team_names.includes(player2)) {
                            truthy = false
                        }
                    }
                    return truthy
                }
                if (game.blue_team_names.includes(player)) {
                    let truthy = true
                    for (let player2 of team) {
                        if (!game.blue_team_names.includes(player2)) {
                            truthy = false
                        }
                    }
                    return truthy
                }
            }
            return false
        })
        return games
    }

    handleChangeTeam1 = (event) => {
        const {
            target: { value },
        } = event;
        this.setState({ team1: typeof value === 'string' ? value.split(',') : value })
    };

    handleChangeTeam2 = (event) => {
        const {
            target: { value },
        } = event;
        this.setState({ team2: typeof value === 'string' ? value.split(',') : value })
    };

    handleChangeTeam1Relations = (event) => {
        this.setState({ team1Relation: event.target.value })
    };

    handleChangeTeam2Relations = (event) => {
        this.setState({ team2Relation: event.target.value })
    };

    getStyles(name, personName) {
        return {
            fontWeight:
                personName.indexOf(name) === -1
                    ? "normal"
                    : "bold",
        };
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
                        <FormControl sx={{ m: 1, minWidth: 240 }}>
                            <Select
                                multiple
                                id="team1-input"
                                value={this.state.team1}
                                onChange={this.handleChangeTeam1}
                            >
                                    {
                                        this.state.players ? this.state.players.map((player) => (
                                            !this.state.team2.includes(player.name) ?
                                            <MenuItem
                                                key={player.name}
                                                value={player.name}
                                                style={this.getStyles(player.name, this.state.team1)}
                                            >
                                                {player.name}
                                            </MenuItem> : null
                                        )) : null
                                }
                            </Select>
                            <FormHelperText>Team 1</FormHelperText>
                        </FormControl>
                        <FormControl sx={{ m: 1, minWidth: 140 }}>
                            <Select
                                value={this.state.team1Relation}
                                onChange={this.handleChangeTeam1Relations}
                                displayEmpty
                                inputProps={{ 'aria-label': 'Without label' }}
                            >
                                <MenuItem key={"contains"} value={"contains"}>
                                    {"contains"}
                                </MenuItem>
                                <MenuItem key={"has exactly"} value={"has exactly"}>
                                    {"has exactly"}
                                </MenuItem>
                            </Select>
                            <FormHelperText>Relation</FormHelperText>
                        </FormControl>
                        <Divider orientation="vertical" flexItem sx={{ paddingLeft: 3, paddingRight: 3 }}>
                            VS
                        </Divider>
                        <FormControl sx={{ m: 1, minWidth: 240 }}>
                            <Select
                                multiple
                                displayEmpty
                                id="team2-input"
                                value={this.state.team2}
                                onChange={this.handleChangeTeam2}
                            >
                                {
                                    this.state.players ? this.state.players.map((player) => (
                                        !this.state.team1.includes(player.name) ?
                                        <MenuItem
                                            key={player.name}
                                            value={player.name}
                                            style={this.getStyles(player.name, this.state.team2)}
                                        >
                                            {player.name}
                                        </MenuItem> : null
                                    )) : null
                                }
                            </Select>
                            <FormHelperText>Team 2</FormHelperText>
                        </FormControl>
                        <FormControl sx={{ m: 1, minWidth: 140 }}>
                            <Select
                                value={this.state.team2Relation}
                                onChange={this.handleChangeTeam2Relations}
                                displayEmpty
                                inputProps={{ 'aria-label': 'Without label' }}
                            >
                                <MenuItem key={"contains"} value={"contains"}>
                                    {"contains"}
                                </MenuItem>
                                <MenuItem key={"has exactly"} value={"has exactly"}>
                                    {"has exactly"}
                                </MenuItem>
                            </Select>
                            <FormHelperText>Relation</FormHelperText>
                        </FormControl>

                        <Divider orientation="vertical" flexItem sx={{ paddingLeft: 3, paddingRight: 3 }}>
                            Date
                        </Divider>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <FormControl sx={{ m: 1, maxWidth: 100 }}>
                                <DatePicker
                                    label="From"
                                    value={this.state.startDate}
                                    onChange={(newValue) => this.setStartDate(newValue)}
                                />
                            </FormControl>

                            <FormControl sx={{ m: 1, maxWidth: 100 }}>
                                <DatePicker
                                    label="To"
                                    value={this.state.endDate}
                                    onChange={(newValue) => this.setEndDate(newValue)}
                                />
                            </FormControl>
                        </LocalizationProvider>

                        <FormControl sx={{ m: 1, maxWidth: 100, marginLeft: 5 }}>
                            <IconButton size="large" onClick={this.filterGames}>
                                <PlayCircleIcon fontSize="large" />
                            </IconButton>
                        </FormControl>


                    </FormGroup>
                </Box>


                <Box sx={{
                    "& .MuiFormGroup-root":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                }}>
                    <FormGroup
                        sx={{
                            p: 2,
                            m: 10,
                            marginLeft: 25,
                            marginRight: 25,
                            boxShadow: 10,
                            display: "flex",
                            paddingLeft: '5%', paddingRight: '5%', paddingTop: '3%', paddingBottom: '3%'
                        }}
                        row={true}
                    >
                        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={3}>
                                <Card sx={{
                                    backgroundColor: "rgba(250, 250, 250, .3)",
                                    padding: 2,
                                    textAlign: 'center',}}
                                >
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Team 1 Win/Loss Ratio
                                        </Typography>
                                        <Typography variant="body2">
                                        </Typography>
                                        <Typography variant="h3" component="div">
                                            {`${this.state.wlr}%`}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={3}>
                                <Card sx={{
                                    backgroundColor: "rgba(250, 250, 250, .3)",
                                    padding: 2,
                                    textAlign: 'center',}}
                                >
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Games Played
                                        </Typography>
                                        <Typography variant="body2">
                                        </Typography>
                                        <Typography variant="h3" component="div">
                                            {this.state.totalGames}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={3}>
                                <Card sx={{
                                    backgroundColor: "rgba(250, 250, 250, .3)",
                                    padding: 2,
                                    textAlign: 'center',}}
                                >
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Average Goals
                                        </Typography>
                                        <Typography variant="body2">
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {
                                                this.state.totalGames !== 0 ?
                                                `${(this.state.totalGoals[0] / this.state.totalGames).toFixed(1)} : 
                                                ${(this.state.totalGoals[1] / this.state.totalGames).toFixed(1)}`
                                                : `0 : 0`
                                            }
                                        </Typography>
                                        <Typography sx={{ mb: -0.7, fontSize: 13 }} color="text.secondary">
                                            Team 1   :   Team 2
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item={true} paddingRight={5} paddingLeft={5} xs={3}>
                                <Card sx={{
                                    backgroundColor: "rgba(250, 250, 250, .3)",
                                    padding: 2,
                                    textAlign: 'center',}}
                                >
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Average Game Time
                                        </Typography>
                                        <Typography variant="body2">
                                        </Typography>
                                        <Typography variant="h3" component="div">
                                            {
                                                this.state.totalGames !== 0 ?
                                                    this.parseTime(Math.round(this.state.totalGameTime / this.state.totalGames))
                                                    : `0.00`
                                            }
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </FormGroup>
                </Box>


                <Form style={{paddingLeft: '15%', paddingRight: '15%', paddingBottom: '10%'}}>
                    {   this.state.filteredGames ?
                        <div style={{height: 630.5, width: '100%'}}>
                        <DataGrid
                                rows={this.state.filteredGames}
                                columns={this.state.columns}
                                pageSize={10}
                                rowsPerPageOptions={[10]}
                                sx={{
                                    boxShadow: 10,
                                    "& .MuiDataGrid-main":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                    "& .MuiDataGrid-footerComponent":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                    "& .MuiDataGrid-footerContainer":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                    "& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus": {
                                        outline: "none !important",
                                    },
                                    "& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader:focus":
                                        {
                                            outline: "none !important",
                                        },
                                }}
                                components={{
                                    NoRowsOverlay: GridNoResultsOverlay
                                }}
                                initialState={{
                                    sorting: {
                                        sortModel: [{ field: 'date', sort: 'desc' }],
                                    },
                                }}
                        />
                    </div> : null}
                </Form>
                {<ConfirmModal handleClick={this.handleClick}/>}
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