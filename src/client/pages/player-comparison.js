import React from "react";
import {Form} from "react-bootstrap";
import {getGames, getPlayers} from "../services/api";
import { DataGrid } from '@mui/x-data-grid';
import { GridLoadingOverlay } from "@mui/x-data-grid";
import {
    Box,
    Button, Divider,
    FormControl,
    FormGroup,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    useTheme
} from "@mui/material";
import toastr from "toastr";
import $ from "jquery";
import { withTheme } from '@material-ui/core/styles';
import {blue100} from "mui/source/styles/colors";

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

        this.state = {
            games: [],
            filteredGames: [],
            players: null,
            team1: [],
            team2: [],
            team1Relation: "",
            team2Relation: "",
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
                        `${this.getTeamNames(params.row.red_team)}`,
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
                        `${this.getTeamNames(params.row.blue_team)}`,
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
                    game.game_time = this.parseTime(game.game_time)
                })
                this.setState({ games: games });
            })
        })
    }

    dateComparator = (v1, v2, param1, param2) => param1.id - param2.id

    getTeamNames(members) {
        let names = ''
        for (let i of members) {
            names += this.state.players.filter(player => player.id === i)[0].name + ', '
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
                        }}
                        row={true}
                    >
                        <FormControl sx={{ m: 1, minWidth: 120 }}>
                            <InputLabel id="team1-input-label">Team 1</InputLabel>
                            <Select
                                multiple
                                labelId="team1-input-label"
                                id="team1-input"
                                value={this.state.team1}
                                label="Team 1"
                                onChange={this.handleChangeTeam1}
                            >
                                    {
                                        this.state.players ? this.state.players.map((player) => (
                                            <MenuItem
                                                key={player.name}
                                                value={player.name}
                                                style={this.getStyles(player.name, this.state.team1)}
                                            >
                                                {player.name}
                                            </MenuItem>
                                        )) : null
                                }
                            </Select>
                            <FormHelperText>With label + helper text</FormHelperText>
                        </FormControl>
                        <FormControl sx={{ m: 1, minWidth: 120 }}>
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
                            <FormHelperText>Without label</FormHelperText>
                        </FormControl>
                        <Divider orientation="vertical" flexItem sx={{ paddingLeft: 3, paddingRight: 3 }}>
                            VS
                        </Divider>
                        <FormControl sx={{ m: 1, minWidth: 120 }}>
                            <InputLabel id="team2-input-label"/>
                            <Select
                                multiple
                                displayEmpty
                                labelId="team2-input-label"
                                id="team2-input"
                                value={this.state.team2}
                                label="Team 2"
                                onChange={this.handleChangeTeam2}
                                renderValue={(selected) => {
                                    if (selected.length === 0) {
                                        return <em>Any</em>;
                                    }

                                    return selected.join(', ');
                                }}
                            >
                                <MenuItem disabled value="">
                                    <em>Any</em>
                                </MenuItem>
                                {
                                    this.state.players ? this.state.players.map((player) => (
                                        <MenuItem
                                            key={player.name}
                                            value={player.name}
                                            style={this.getStyles(player.name, this.state.team2)}
                                        >
                                            {player.name}
                                        </MenuItem>
                                    )) : null
                                }
                            </Select>
                            <FormHelperText>With label + helper text</FormHelperText>
                        </FormControl>
                        <FormControl sx={{ m: 1, minWidth: 120 }}>
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
                            <FormHelperText>Without label</FormHelperText>
                        </FormControl>
                    </FormGroup>
                    </Box>



                <Form style={{paddingLeft: '15%', paddingRight: '15%', paddingTop: '7%', paddingBottom: '10%'}}>
                    {   this.state.games ?
                        <div style={{height: 630.5, width: '100%'}}>
                        <DataGrid
                                rows={this.state.games}
                                columns={this.state.columns}
                                pageSize={10}
                                rowsPerPageOptions={[10]}
                                sx={{
                                    boxShadow: 10,
                                    "& .MuiDataGrid-main":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                    "& .MuiDataGrid-footerComponent":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                    "& .MuiDataGrid-footerContainer":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                }}
                                components={{
                                    NoRowsOverlay: GridLoadingOverlay
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