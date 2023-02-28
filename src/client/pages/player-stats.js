import React from "react";
import {getPlayers} from "../services/api";
import {DataGrid, GridLoadingOverlay} from '@mui/x-data-grid';
import {Form} from "react-bootstrap";
import toastr from "toastr";


export class PlayerStats extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            games: [],
            players: [],
            columns: [
                { field: 'name', headerName: 'Name', width: 150 },
                { field: 'elo', headerName: 'ELO', width: 100 },
                {
                    field: 'wlr',
                    headerName: 'Win/Loss Ratio',
                    width: 150,
                    valueGetter: (params) =>
                            `${this.getWinLossRatio(params.row.games_won, params.row.games_played)}%`,
                    sortComparator: this.percentageComparator,
                },
                { field: 'games_played', headerName: 'P', width: 100 },
                { field: 'games_won', headerName: 'W', width: 100 },
                { field: 'goals', headerName: 'Goals', width: 100 },
                { field: 'assists', headerName: 'Assists', width: 100 },
                { field: 'kicks', headerName: 'Kicks', width: 100 },
                { field: 'passes', headerName: 'Passes', width: 100 },
                { field: 'own_goals', headerName: 'Own Goals', width: 100 },
                { field: 'shots_on_goal', headerName: 'Shots on Goal', width: 120 },
            ]
        }
    }

    percentageComparator = (v1, v2) => parseInt(v1.split('.')[0]) - parseInt(v2.split('.')[0])

    componentDidMount() {
        getPlayers().then((res) => {
            this.setState({ players: res.data });
        }).catch((err) => {
            toastr.error("Server error when getting player stats")
        })
    }

    getWinLossRatio(won, played) {
        let wlr = 0
        if (won !== 0) {
            wlr = (100 * won) / (played)
        }
        return wlr.toFixed(2)
    }

    render() {
        return (
            <Form style={{paddingLeft: '10%', paddingRight: '10%', paddingTop: '7%', paddingBottom: '25%'}}>
                {   this.state.players ?
                    <div style={{height: 525, width: '100%'}}>
                        <DataGrid
                            rows={this.state.players}
                            columns={this.state.columns}
                            pageSize={10}
                            components={{
                                NoRowsOverlay: GridLoadingOverlay
                            }}
                            sx={{
                                boxShadow: 10,
                                "& .MuiDataGrid-main":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                "& .MuiDataGrid-footerComponent":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                "& .MuiDataGrid-footerContainer":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                            }}
                            sortingOrder={['asc', 'desc']}
                            rowsPerPageOptions={[10]}
                            initialState={{
                                sorting: {
                                    sortModel: [{ field: 'elo', sort: 'desc' }],
                                },
                            }}
                        />
                    </div> :
                        null}
            </Form>
        )
    }
}