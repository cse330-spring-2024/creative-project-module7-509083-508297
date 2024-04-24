const { useRef,useEffect, useState } = React

function LoginNotification(){
    return ReactDOM.createPortal(
        <div>
            <h2>Health Dashboard</h2>
            <p>You must LOGIN to continue.</p>
        </div>,
        document.getElementById('dashboard')
    );
}

function LoginDialog({setLoginState, onClose}) {
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupUsername, setSignupUsername] = useState('');
    const [signupPassword, setSignupPassword] = useState('');

    //mike change start
    const handleLogin = async (e) => {
        e.preventDefault();
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ loginUsername, loginPassword }),
        });
        const data = await response.json();
        console.log(data);
        if(data.success){
            //onClose();
            setLoginState(true, data.username);

        }else {
            //onClose();
            alert(data.message);
        }
        onClose();
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ signupUsername, signupPassword }),
        });
        const data = await response.json();
        alert(data.message);
        onClose();
    };

    //mike change done



    return ReactDOM.createPortal(
        <div className="dialog">
            <div className="dialog_content">
                <div className="aclose">
                    <span></span>
                    <a className="close" onClick={onClose}>&times;</a>
                </div>
                <div className="contain">
                    <p>Login</p>
                    <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                           placeholder="Username"/>
                    <br/>
                    <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                           placeholder="Password"/>
                    <br/>
                    <button onClick={handleLogin}>Login</button>
                    <hr/>
                    <p>Sign Up</p>
                    <input type="text" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)}
                           placeholder="Username"/>
                    <br/>
                    <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                           placeholder="Password"/>
                    <br/>
                    <button onClick={handleSignup}>Signup</button>
                </div>
            </div>
        </div>,
        document.body
    );
}

//mike change start
function LoginButton({onClick}) {
    // Render navigation with a login button
    return [
        <a href="#" key="dashboard">Dashboard</a>,
        <a href="#" key="friends">Friends</a>,
        <a href="#" key="link">Link</a>,
        <a href="#" id="login-btn" onClick={onClick} key="login">{"Login"}</a>
    ];
}
//mike change done


function App() {
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [healthMessage, setHealthMessage] = useState('');
    const handleLoginButtonClick = () => {
        setShowLoginDialog(true);
    };

    const handleCloseDialog = () => {
        setShowLoginDialog(false);
    };


    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    const handleLogin = (state, username) => {
        setIsLoggedIn(state);
        setUsername(username);
        fetchHealthTips(username);
    };

    const fetchHealthTips = async () => {

        const response = await fetch('/api/bmi/recent', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const data = await response.json();
        if (data.success) {
            setHealthMessage(data.message + "The new BMI is: "+data.newestBMI + " The old BMI is: "+data.olderBMI);
        } else {
            setHealthMessage("Unable to retrieve health tips.");
        }
    };
    return (
        <div>
            {!isLoggedIn && <LoginButton onClick={handleLoginButtonClick}/>}
            {!isLoggedIn && <LoginNotification/>}
            {isLoggedIn && <LogoutButton onClick={handleLogout}/>}
            {showLoginDialog && <LoginDialog setLoginState={handleLogin} onClose={handleCloseDialog}/>}
            {isLoggedIn && <Initialization username={username} onLogout={handleLogout}/>}
            {isLoggedIn && <HealthDataForm updateMessage = {fetchHealthTips}/>}
            {/*{isLoggedIn && <HealthTips username={username}/>}*/}
            {(healthMessage && isLoggedIn) && <p className="message-container">{healthMessage}</p>}

        </div>
    );
    //            {isLoggedIn && <BMIChart username={username}/>}
}

ReactDOM.render(
    <App/>,
    document.getElementById('toolbar')
);



function LogoutButton({onClick}) {
    const handleClick = (e) => {
        e.preventDefault();
        onClick();
    }
    return(
        <div>
            <a href="#" key="dashboard">Dashboard</a>
            <a href="#" key="friends">Friends</a>
            <a href="#" key="link">Link</a>
            <a href="#" id="login-btn" onClick={handleClick} key="login">{"Logout"}</a>
        </div>
    );
}

function Initialization({username, onLogout}){

    return ReactDOM.createPortal(
        <div>
            <h2>Health Dashboard</h2>
            <p>Welcome, {username}</p>
        </div>,
        document.getElementById('dashboard')
    );
}

//enter data (steps, heartrate, sleepTime, weight, height, calories, bmi)
//mike started

function HealthDataForm({updateMessage}) {
    const today = new Date();
    const month = (today.getMonth() + 1).toFixed(0).padStart(2, "0");
    const today_str = today.getFullYear() + "-" + month + "-" + today.getDate();
    const [BMIData, setBMIData] = useState([{ date: 13, y: 10 },
        { date: 14, y: 20 },
        { date: 15, y: 10 },
        { date: 16, y: 60 }]);
    const [date, setDate] =  useState(today_str);
    const [formData, setFormData] = useState({
        date:today_str,
        steps: '',
        heartrate: '',
        sleepTime: '',
        calories: '',  // Added calories to state for user input
        weight: '',
        height: ''
    });
    const [checkedStep, setCheckedStep] = useState(true);
    const [checkedHeartRate, setCheckedHeartRate] = useState(true);
    const [checkedSleep, setCheckedSleep] = useState(true);
    const [checkedCalories, setCheckedCalories] = useState(true);
    const [checkedWeight, setCheckedWeight] = useState(true);
    const [checkedHeight, setCheckedHeight] = useState(true);
    const [isFirstTime, setIsFirstTime] = useState(true);


    const handleChangeStep = () => {
        setCheckedStep(!checkedStep);
    };
    const handleChangeSleep = () => {
        setCheckedSleep(!checkedSleep);
    };
    const handleChangeHeartRate = () => {
        setCheckedHeartRate(!checkedHeartRate);
    };
    const handleChangeCalories = () => {
        setCheckedCalories(!checkedCalories);
    };
    const handleChangeWeight = () => {
        setCheckedWeight(!checkedWeight);
    };
    const handleChangeHeight = () => {
        setCheckedHeight(!checkedHeight);
    };


    const handleChange = async (event) => {
        const {name, value} = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));

        if (name == 'date') {
            if (isFirstTime){
                setIsFirstTime(false);
            }
            setDate(value);

            const response = await fetch('/fetch-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({value})
            });
            const data = await response.json();
            if (data.success){
                setFormData(data.health_data);
            }else{
                setFormData({
                    date: value,
                    steps: '',
                    heartrate: '',
                    sleepTime: '',
                    calories: '',
                    weight: '',
                    height: ''
                });
            }
            const fetch_data = await fetch_bmi_data();
        }
    };

    const fetch_bmi_data = async () => {
        try {
            const response = await fetch('/fetch-data-chart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({date})
            });
            const data = await response.json();
            if (data.success) {
                console.log("Success!");
                const response_data = data.health_data;
                const bmi_data = [];
                response_data.forEach(data => {
                    if (data.bmi != "NaN"){
                        const date_num = parseInt(data.date.slice(-2), 10);
                        const bmi_value = parseInt(data.bmi, 10);
                        console.log(date_num + ": " + bmi_value);
                        bmi_data.push({date: date_num, y: bmi_value});
                    }

                })
                setBMIData(bmi_data);
            } else {
                console.error("Failed to fetch BMI data:", data.message);
            }
        } catch (error) {
            console.error("An error occurred while fetching BMI data:", error.message);
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        const fetch_data = await fetch_bmi_data();
        const response_submit = await fetch('/submit-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        const data_submit = await response_submit.json();
        updateMessage();

    };

    const LineChart = () => {
        // refs
        const svgRef = useRef();
        const xAxisRef = useRef();
        const yAxisRef = useRef();
        const width = 400;
        const height = 300;

        // draws chart
        useEffect(() => {
            const svg = d3.select(svgRef.current);
            const xAxis = d3.select(xAxisRef.current);
            const yAxis = d3.select(yAxisRef.current);

            // margins and dimensions
            const margin = { top: 20, right: 40, bottom: 50, left: 50 };

            // new data range
            const newDataRange = BMIData.map(d => d.date);

            // scales
            const xScale = d3.scaleLinear()
                .domain([d3.min(newDataRange), d3.max(newDataRange)])
                .range([margin.left, width - margin.right]);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(BMIData, d => d.y)])
                .range([height - margin.bottom, margin.top]);

            // axes
            const xAxisGenerator = d3.axisBottom(xScale).ticks(BMIData.length).tickFormat(d3.format("d"));
            xAxis.call(xAxisGenerator)
                .attr("transform", `translate(0, ${height - margin.bottom})`);

            const yAxisGenerator = d3.axisLeft(yScale);
            yAxis.call(yAxisGenerator)
                .attr("transform", `translate(${margin.left}, 0)`);

            // line generator
            const myLine = d3.line()
                .x((d, i) => xScale(d.date))
                .y((d) => yScale(d.y))
                .curve(d3.curveCardinal);

            // drawing the line
            svg.selectAll(".line")
                .data([BMIData])
                .join("path")
                .attr("class", "line")
                .attr("d", myLine)
                .attr("fill", "none")
                .attr("stroke", "#00bfa6");

            // Add x-axis label
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height - margin.bottom / 3)
                .attr("text-anchor", "middle")
                .attr("fill", "#000")
                .text("Date");

            // Add y-axis label
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", margin.left)
                .attr("x", -(height / 2))
                .attr("dy", "1em")
                .attr("text-anchor", "middle")
                .attr("fill", "#000")
                .text("BMI")
                .style("padding-right", "20px"); // Adjust this value as needed

        }, [BMIData]);

        return (
            <svg ref={svgRef} width={width} height={height}>
                <g ref={xAxisRef} className="x-axis" />
                <g ref={yAxisRef} className="y-axis" />
            </svg>
        );
    };



    return ReactDOM.createPortal(
        <div>
            <fieldset>
                <legend>Select data to display</legend>

                <div>
                    <input type="checkbox" id="steps" name="steps" checked={checkedStep} onChange={handleChangeStep}/>
                    <label htmlFor="steps">Steps</label>
                </div>
                <div>
                    <input type="checkbox" id="heartrate" name="heartrate" checked={checkedHeartRate}
                           onChange={handleChangeHeartRate}/>
                    <label htmlFor="heartrate">Heart Rate</label>
                </div>
                <div>
                    <input type="checkbox" id="sleep_time" name="sleep_time" checked={checkedSleep}
                           onChange={handleChangeSleep}/>
                    <label htmlFor="sleep_time">Sleep Time</label>
                </div>
                <div>
                    <input type="checkbox" id="calories" name="calories" checked={checkedCalories}
                           onChange={handleChangeCalories}/>
                    <label htmlFor="calories">Calories</label>
                </div>
                <div>
                    <input type="checkbox" id="weight" name="weight" checked={checkedWeight}
                           onChange={handleChangeWeight}/>
                    <label htmlFor="weight">Weight</label>
                </div>
                <div>
                    <input type="checkbox" id="height" name="height" checked={checkedHeight}
                           onChange={handleChangeHeight}/>
                    <label htmlFor="height">Height</label>
                </div>
            </fieldset>
            <form onSubmit={handleSubmit}>
                <label htmlFor="date">Date:</label>
                <input type="date" name="date" value={date} onChange={handleChange}
                       placeholder="date"/>
                {checkedStep && <div><label htmlFor="steps"> Steps:</label>
                    <input type="number" name="steps" value={formData.steps} onChange={handleChange}
                           placeholder="Steps"/></div>}
                {checkedHeartRate && <div><label htmlFor="heartrate"> Heart Rate:</label>
                    <input type="number" name="heartrate" value={formData.heartrate} onChange={handleChange}
                           placeholder="Heart Rate"/></div>}
                {checkedSleep && <div><label htmlFor="sleepTime"> Sleep Time (hours):</label>
                    <input type="number" name="sleepTime" value={formData.sleepTime} onChange={handleChange}
                           placeholder="Sleep Time (hours)"/></div>}
                {checkedCalories && <div><label htmlFor="calories"> Calories:</label>
                    <input type="number" name="calories" value={formData.calories} onChange={handleChange}
                           placeholder="Calories"/></div>}
                {checkedWeight && <div><label htmlFor="weight"> Weight (kg):</label>
                    <input type="number" name="weight" value={formData.weight} onChange={handleChange}
                           placeholder="Weight (kg)"/></div>}
                {checkedHeight && <div><label htmlFor="height"> Height (cm):</label>
                    <input type="number" name="height" value={formData.height} onChange={handleChange}
                           placeholder="Height (cm)"/></div>}
                <button type="submit">Update</button>
            </form>
            <LineChart></LineChart>
        </div>,
        document.getElementById('dashboard')
    );
}