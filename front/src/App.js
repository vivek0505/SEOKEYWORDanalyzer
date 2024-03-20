// eslint-disable-next-line

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {SetStateAction, useEffect, useState, useRef, useCallback} from 'react';
import {Container, Typography, Box, Modal, TextField, Button, Divider} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Select from 'react-select';
import Chart from 'chart.js/auto'
import CheckIcon from '@mui/icons-material/Check';
import ReactWordcloud from 'react-wordcloud';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    borderRadius: '10px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

function App() {
    const [state, setState] = useState({
        searchInput: "",
        inputURL: "",
        needToOpenModal: false,
        modalTitle: "",
        modalDescription: "",
        loadingProgressValue: 0,
        isLoading: false,
        algoOptions: [
            {value: 'rabin', label: 'Rabin Karp'},
            {value: 'suffixt', label: 'Suffix Tree'},
            {value: 'suffixa', label: 'Suffix Array'},
            {value: 'naive', label: 'Naive String Matching'},
            {value: 'kmp', label: 'KMP Algorithm'}
        ],
        selectedAlgoOptions: [],
        resultsToShow: [],
        graph: undefined,
    });

    const [words, setWords] = useState([])
    const [apiData, setApiData] = useState([])

    const customStyles = {
        menu: base => ({
            ...base,
            zIndex: 100,
        })
    };

    function checkIfURLisValid(url) {
        if (!url) {
            return false
        }

        var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        var regex = new RegExp(expression);

        return url.match(regex)
    }

    const didClickOnCheckButton = () => {

        const currentInput = state.searchInput

        if (!currentInput) {
            setState(prevState => {
                return {
                    ...prevState,
                    needToOpenModal: true,
                    modalTitle: "Error",
                    modalDescription: "You need to enter a word."
                }
            })
        }

        const data = {
            "word": currentInput,
            "url": state.inputURL
        }

        fetch("http://127.0.0.1:5000/check", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(json => {
                const result = json["result"]

                if (result) {
                    setState(prevState => {
                        return {
                            ...prevState,
                            needToOpenModal: true,
                            modalTitle: "Success",
                            modalDescription: currentInput + " exists in the URL."
                        }
                    })
                } else {
                    setState(prevState => {
                        return {
                            ...prevState,
                            needToOpenModal: true,
                            modalTitle: "Error",
                            modalDescription: currentInput + " doesn't exist in the URL."
                        }
                    })
                }
            })



    }

    const didClickOnSearchButton = () => {

        const currentInput = state.inputURL

        if (!currentInput) {
            // show popup
            setState(prevState => {
                return {
                    ...prevState,
                    needToOpenModal: true,
                    modalTitle: "Error",
                    modalDescription: "You need to enter URL."
                }
            })
            return
        }

        if (!checkIfURLisValid(currentInput)) {
            // show popup
            setState(prevState => {
                return {
                    ...prevState,
                    needToOpenModal: true,
                    modalTitle: "Error",
                    modalDescription: "It's not valid input."
                }
            })

            return
        }

        if (!state.selectedAlgoOptions || state.selectedAlgoOptions.length == 0) {
            // show popup

            setState(prevState => {
                return {
                    ...prevState,
                    needToOpenModal: true,
                    modalTitle: "Error",
                    modalDescription: "You need to choose at least one algorithm."
                }
            })

            return
        }

        // map selected options to label
        const selectedAlgoOptions = state.selectedAlgoOptions.map((option) => {
            return option.value
        })

        setState(prevState => {
            return {
                ...prevState,
                isLoading: true
            }
        })

        if (state.graph) {
            state.graph.destroy()
        }

        const data = {
            "url": state.inputURL,
            "options": state.selectedAlgoOptions
        }

        fetch("http://127.0.0.1:5000/search", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(json => {

                const selectedOption = selectedAlgoOptions[0]
                const target = json[selectedOption]
                const time_array = json["time"]
                const visible_keywords = target["visible_keyword"]

                if (!target || !target["keywords"]) {
                    return
                }

                const keywords = target["keywords"]

                setState(prevState => {
                    return {
                        ...prevState,
                        isLoading: false,
                        resultsToShow: [
                            {
                                type: "text_list",
                                title: state.selectedAlgoOptions[0].label,
                                list: keywords.map((keyword) => {
                                    return {
                                        text: keyword,
                                        isUsed: visible_keywords.includes(keyword)
                                    }
                                })
                            }
                        ],
                        words: keywords.map((keyword, idx) => {
                            return {
                                text: keyword,
                                value: 20 - idx
                            }
                        })
                    }
                })


                // create chart from timeline from each algorithm.
                const data = {
                    labels: ["KMP", "Naive", "Rabin Karp", "Suffix Array", "Suffix Tree"],
                    datasets: [
                        {
                            label: 'Time taken by each algorithm',
                            data: time_array,
                            fill: false,
                            borderColor: '#1976d2',
                            tension: 0.1
                        }
                    ]
                }


                if (state.graph) {
                    state.graph.destroy()
                }

                const graph = new Chart(
                    document.getElementById("myChart"),
                    {
                        type: "line",
                        data: data,
                        options: {
                            layout: {
                                autoPadding: true
                            },
                            animation: true,
                            plugins: {
                                legend: {
                                    display: true
                                },
                                tooltip: {
                                    enabled: true
                                }
                            }
                        }
                    })

                setState(prevState => {
                    return {
                        ...prevState,
                        graph: graph
                    }
                })

            })
            .catch(err => {
                console.log(err)
            })

            fetch("http://127.0.0.1:5000/api", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({url: state.inputURL})
            }).then(response => { console.log(response); return response.json();})
            .then(responseJSON => setApiData(responseJSON))
            .catch(err => {
                console.log(err)
            })
    }

    function didChooseAlgoOptions(options) {
        setState(prevState => {
            return {
                ...prevState,
                selectedAlgoOptions: options
            }
        })
    }

    function InformationBox() {
        return (
            <Box
                p={2}
                boxShadow={2}
                fontFamily="sans-serif"
                mt={2} // Add some top margin to separate it from the chart
            >
                <Typography variant="h5" gutterBottom>
                    What is Keyword Pulse?
                </Typography>
                <Typography variant="body1">
                    Keyword Pulse scrapes the URL to give out better keyword suggestions which can help you rank on
                    SERPs.

                    The graph below shows time taken by each algorithm to show the list of "Top 10 Keywords" based off
                    the searching method.
                </Typography>

            </Box>
        );
    }

    return (
        <div className="App">
            <div className="content-container">
                <div className={"content-top-container"}>
                    <Box
                        p={4}
                        boxShadow={0}
                        fontFamily="sans-serif"
                    >
                        <Typography
                            variant="h3" gutterBottom
                        >
                            KeywordPulse
                        </Typography>

                        <Typography variant="subtitle1" gutterBottom>
                            Everything you need to rank higher & get more traffic!</Typography>
                        <Divider/>
                    </Box>

                    <div
                        className="select-container"
                    >
                        <Select
                            isMulti={true}
                            name="algoOptions"
                            options={state.algoOptions}
                            className="basic-multi-select"
                            classNamePrefix="select"
                            isSearchable={true}
                            onChange={didChooseAlgoOptions}
                            styles={customStyles}
                        />

                        {
                            state.resultsToShow.length > 0 &&
                            <div
                                className="keyword-exist-container"
                            >
                                <TextField
                                    sx={{minWidth: '230px'}}
                                    label="Check if word exists in URL"
                                    size={"small"}
                                    onInput={(e) => {
                                        const value = e.target.value
                                        setState(prevState => {
                                            return {
                                                ...prevState,
                                                searchInput: value
                                            }
                                        })
                                    }}
                                />

                                <Button
                                    sx={{marginTop: '3px'}}
                                    variant="contained"
                                    onClick={didClickOnCheckButton}
                                >
                                    Check
                                </Button>

                            </div>
                        }
                    </div>

                    <div className="top-container">
                        <div
                            className="input-container"
                        >
                            <TextField
                                sx={{width: '100%'}}
                                label="Enter URL"
                                variant="outlined"
                                onInput={(e) => {
                                    const value = e.target.value
                                    setState(prevState => {
                                        return {
                                            ...prevState,
                                            inputURL: value
                                        }
                                    })
                                }}
                            />
                        </div>

                        <Button
                            variant="contained"
                            onClick={didClickOnSearchButton}
                        >
                            Search
                        </Button>

                    </div>
                    {
                        (state.isLoading) &&
                        <div
                            className="progress-container"
                        >
                            <div className="lds-roller">
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                        </div>
                    }

                </div>

                <div className={"content-bottom-container"}>

                    {
                        !state.isLoading && state.resultsToShow.length > 0 &&
                        <div
                            className={"col-12 cloud-container"}
                        >
                            <div>
                                <ReactWordcloud
                                    words={state.words}
                                    options={{
                                        rotations: 0,
                                        rotationAngles: [0, 0],
                                        scale: "sqrt",
                                        spiral: "archimedean",
                                        fontSizes: [40, 110],
                                        fontFamily: "impact",
                                        deterministic: false,
                                    }}
                                    transitionDuration={1000}
                                />
                            </div>
                        </div>
                    }

                    {
                        !state.isLoading && state.resultsToShow.length > 0 &&
                        state.resultsToShow.map((result) => {
                            return <div
                                className={"col-6"}
                                key={result.title}
                            >
                                <div
                                    className={"result-container"}
                                >
                                    {
                                        result.type == "text_list" &&
                                        <div>
                                            <h1
                                                className={"title"}>
                                                {result.title}
                                            </h1>

                                            <div className={"result-top-container"}>
                                                <h4 className={"col-6"}>Keywords</h4>
                                                <h4 className={"col-6"}>Currently Used</h4>
                                            </div>

                                            {
                                                result.list.map((item, index) => {
                                                    return <div
                                                        className={"result-bottom-container"}
                                                    >
                                                        <p
                                                            className={"col-6 description"}
                                                            key={item.text}
                                                        >
                                                            {index + 1}. {item.text}
                                                        </p>


                                                        {
                                                            item.isUsed &&
                                                            <div
                                                                className={"col-6 icon-container"}
                                                            >
                                                                <CheckIcon></CheckIcon>
                                                            </div>
                                                        }

                                                    </div>

                                                })
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        })
                    }

                    <div
                        className={"col-6 graph-container"}
                    >
                        <InformationBox/>
                        <br></br>
                        <canvas
                            id={"myChart"}
                        />
                    </div>

                    {
                        !state.isLoading && state.resultsToShow.length > 0 && <APITable style={{marginTop: '25rem'}} rows={apiData} /> }
                </div>

            </div>

            <Modal
                open={state.needToOpenModal}
                onClose={() => {
                    setState(prevState => {
                        return {
                            ...prevState,
                            needToOpenModal: false
                        }
                    })
                }}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography
                        variant="h6"
                        component="h1"
                    >
                        {
                            state.modalTitle
                        }
                    </Typography>

                    <Typography
                        sx={{mt: 2}}
                    >
                        {state.modalDescription}
                    </Typography>
                </Box>
            </Modal>
        </div>
    );
}

function APITable(rows) {
    return (
        
        <TableContainer style={{marginTop: '2.5rem'}} component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                <TableRow>
                    <TableCell>Keyword</TableCell>
                    <TableCell>Keyword Competition</TableCell>
                    <TableCell>Cost Per Click</TableCell>
                    <TableCell>Search Volume</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {rows?.rows?.tasks?.[0].result.map((row, index) => (
                    <TableRow
                    key={row.keyword + index}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                    <TableCell>{row.keyword}</TableCell>
                    <TableCell>{row.competition}</TableCell>
                    <TableCell>{row.cpc}</TableCell>
                    <TableCell>{row.search_volume}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default App;
