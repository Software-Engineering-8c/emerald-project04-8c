import React, { useEffect, useRef, useState, useReducer } from 'react';
import { Link } from 'react-router-dom';
import '../../ActivityLevels.less';
import { compileArduinoCode, getArduino, handleSave } from '../../Utils/helpers'; // CHANGE OCCURED HERE, ADDED "getArduino" and "handleSave"
import { message, Spin, Row, Col, Alert, Menu, Dropdown } from 'antd';
import CodeModal from '../modals/CodeModal';
import ConsoleModal from '../modals/ConsoleModal';
import PlotterModal from '../modals/PlotterModal';
import {
  connectToPort,
  handleCloseConnection,
  handleOpenConnection,
} from '../../Utils/consoleHelpers';
import ArduinoLogo from '../Icons/ArduinoLogo';
import PlotterLogo from '../Icons/PlotterLogo';
import ArduinoVerify from '../Icons/ArduinoVerify';
import AutoSubmit from '../Icons/AutoSubmit';

let plotId = 1;

export default function PublicCanvas({ activity, isSandbox }) {
  const [hoverUndo, setHoverUndo] = useState(false);
  const [hoverRedo, setHoverRedo] = useState(false);
  const [hoverVerify, setHoverVerify] = useState(false);
  const [hoverAutoSub, setHoverAutoSub] = useState(false);
  const [hoverCompile, setHoverCompile] = useState(false);
  const [hoverConsole, setHoverConsole] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showPlotter, setShowPlotter] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [selectedCompile, setSelectedCompile] = useState(false);
  const [compileError, setCompileError] = useState('');

  const [forceUpdate] = useReducer((x) => x + 1, 0);
  const workspaceRef = useRef(null);
  const activityRef = useRef(null);

  const setWorkspace = () => {
    workspaceRef.current = window.Blockly.inject('blockly-canvas', {
      toolbox: document.getElementById('toolbox'),
    });
  };

  useEffect(() => {
    // once the activity state is set, set the workspace and save
    const setUp = async () => {
      activityRef.current = activity;
      if (!workspaceRef.current && activity && Object.keys(activity).length !== 0) {
        setWorkspace();
      }
    };
    setUp();
  }, [activity]);

  const handleUndo = () => {
    if (workspaceRef.current.undoStack_.length > 0)
      workspaceRef.current.undo(false);
  };

  const handleRedo = () => {
    if (workspaceRef.current.redoStack_.length > 0)
      workspaceRef.current.undo(true);
  };

  const handleConsole = async () => {
    // console.print("HERE")
    if (showPlotter) {
      message.warning('Close serial plotter before openning serial monitor');
      return;
    }
    // if serial monitor is not shown
    if (!showConsole) {
      // connect to port
      await handleOpenConnection(9600, 'newLine');
      // if fail to connect to port, return
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setConnectionOpen(true);
      setShowConsole(true);
    }
    // if serial monitor is shown, close the connection
    else {
      if (connectionOpen) {
        await handleCloseConnection();
        setConnectionOpen(false);
      }
      setShowConsole(false);
    }
  };

  const handlePlotter = async () => {
    if (showConsole) {
      message.warning('Close serial monitor before openning serial plotter');
      return;
    }

    if (!showPlotter) {
      await handleOpenConnection(
        9600,
        'plot',
        plotData,
        setPlotData,
        plotId,
        forceUpdate
      );
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setConnectionOpen(true);
      setShowPlotter(true);
    } else {
      plotId = 1;
      if (connectionOpen) {
        await handleCloseConnection();
        setConnectionOpen(false);
      }
      setShowPlotter(false);
    }
  };
  /* =============================================================================
                                  STUDENT ADDED CODE START
    MAIN FUNCTIONS DEFINED:
        handleAutoSub(): This function when called will run the auto submit code, this entails
          - Counting the number of various types of inputs/outputs
          - Determines the frequency of a desired pin
            - At the moment the desired pin is in the function call to DetectFrequency()

        handleVerify(): This function runs the verify/compile equivalent for the arduino code without needing an arduino connected
    
    HELPER FUNCIONS DEFINED:
        SearchInCode(stringToFind, arduinoCode):
          - INPUTS: 
            - stringToFind: pass a string that you want to find in student code. 
            - arduinoCode: A string of the student code.
          - OUTPUTS:
            - Returns the number of times the stringToFind occurs in the student code. 

        DetectFrequency(arduinoCode, pinNum):
          - INPUTS:
            - arduinoCode: a string of the student code. 
            - pinNum: The associated pin number in which to find the output frequency for. 
          - OUTPUTS:
            - returnString: returns a string that prints out the frequency and duty cycle of the pin

        DetectConsoleOutput(arduinoCode):
          - INPUTS:
            - arduinoCode: a string of the student code. 
          - OUTPUTS:
            - returnString: returns a string with the found console output of the student code.

    ============================================================================= */

  function SearchInCode(stringToFind, arduinoCode) {
      // code to be executed
    var digInCount = -1;
    let target = -1;
    do {
      // String to search for, returns -1 if not found, CURRENTLY CASE SENSITIVE AND PICKUPS COMMENTS
      let toSearch=stringToFind
      // Store the index of the found string
      target = arduinoCode.indexOf(toSearch);
      // Store only the desired string
      let stringFound = arduinoCode.substring(target, target+toSearch.length);
      arduinoCode = arduinoCode.replace(stringFound, "");
      //console.log(target);
      //console.log(stringFound);
      
      digInCount++;
    }
    while (target != -1);

    return digInCount;
  }

  function DetectFrequency(arduinoCode, pinNum) {
    let returnString = "";

    // In this function we will be taking advantage of the sequeintal nature of the arduino code
    // There are two ways to blink an LED

    // Way No. 2, is using the PWM outputs, this is simply looking at the defined frequency of the PWM pin.
    // First find the output being set to on or off

    // Way No. 1, is turning an output on and off manually with a wait statement in between,
      // This is where the sequentialism of the code will be taken care of.

      // First look for the initial digital write
    let toSearch = "digitalWrite(" + pinNum + ",";

    let target = arduinoCode.indexOf(toSearch);

    let stringFound = arduinoCode.substring(target, target+toSearch.length);

    let initialVal = '';

      // Determine if the digital write is low or high, this will tell us what digital write value to look for next
    if(arduinoCode.substring(target+toSearch.length+1, target+toSearch.length+2) == 'L') {
      stringFound = arduinoCode.substring(target, target+toSearch.length+6)
      arduinoCode = arduinoCode.replace(stringFound, "");
      initialVal = 'L';
    }
    else if(arduinoCode.substring(target+toSearch.length+1, target+toSearch.length+2) == 'H') {
      stringFound = arduinoCode.substring(target, target+toSearch.length+7)
      arduinoCode = arduinoCode.replace(stringFound, "");
      initialVal = 'H';
    }


      // From here we are searching for the first delay to determine 
    toSearch = "delay(";

    target = arduinoCode.indexOf(toSearch);

    // Find the index of the next existing colon, which is the end of the string
    let arduinoCodeArray = arduinoCode;
    arduinoCodeArray.split("");//.forEach(character => console.log(character));
    let index = target;
    let endIndex = target;
    while(target != -1) {
      if(arduinoCodeArray[index] == ';') {
        endIndex = index;
        break;
      }
      index = index+1;
    }

      // At this point the first delay value has been found and stored into firstWait
    let firstWait = arduinoCode.substring(target+6, endIndex-1);

      // The first delay is now removed to find the next delay
    stringFound = arduinoCode.substring(target, endIndex+1);
    arduinoCode = arduinoCode.replace(stringFound, "");


    // Now we want to look for an assertion of a high or low again to confirm the code is working correctly
    toSearch = "digitalWrite(" + pinNum + ",";

    target = arduinoCode.indexOf(toSearch);

    stringFound = arduinoCode.substring(target, target+toSearch.length);
  
    // Determine if the digital write is low or high, this will tell us what digital write value to look for next
      // Find the character whether it be 'L' for LOW or 'H' for HIGH
    let nextVal = arduinoCode.substring(target+toSearch.length+1, target+toSearch.length+2);

    let finalOutput = "";

    if((target == -1) || (initialVal == nextVal)) {
      // IF this occurs it means the student never re-asserted the pin and the code won't function correctly
      finalOutput = "Error: Never changed the value of Pin: " + pinNum;
    }
    else if((initialVal == 'H') && (nextVal == 'L')) {
      // Search for an assertion of LOW
      finalOutput = "Correct H L";
      stringFound = arduinoCode.substring(target, target+toSearch.length+6);
    }
    else if((initialVal == 'L') && (nextVal == 'H')) {
      // Search for an assertion of LOW
      finalOutput = "Correct L H";
      stringFound = arduinoCode.substring(target, target+toSearch.length+7);
    }
    
    // Now that the value was found, we get rid of the string from arduinoCode
    arduinoCode = arduinoCode.replace(stringFound, "");

    // Now look for the next delay value
    // From here we are searching for the second delay to determine 
    toSearch = "delay(";

    target = arduinoCode.indexOf(toSearch);

    // Find the index of the next existing colon, which is the end of the string
    arduinoCodeArray = arduinoCode;
    arduinoCodeArray.split("");//.forEach(character => console.log(character));
    index = target;
    endIndex = target;
    while(target != -1) {
      if(arduinoCodeArray[index] == ';') {
        endIndex = index;
        break;
      }
      index = index+1;
    }

      // At this point the first delay value has been found and stored into firstWait
    let secondWait = arduinoCode.substring(target+6, endIndex-1);

      // The first delay is now removed to find the next delay
    stringFound = arduinoCode.substring(target, endIndex+1);
    arduinoCode = arduinoCode.replace(stringFound, "");

    var freq = 0;
    var dutyCycle = 0;
    // At this point, we have stored the first and second delay, along with if set to low or high
      // The importance in knowing in whether low or high comes and when is so that we can also calculate the duty cycle.
    // No we look to see which digital value goes with which delay
    // Check if digital low is associated with the first delay
    if(finalOutput == "Correct L H") {
      // First digital value is low
      dutyCycle = Number(secondWait) / (Number(firstWait) + Number(secondWait));

      freq = 1 / ((Number(secondWait)+Number(firstWait))/1000);

      dutyCycle = dutyCycle * 100;

      //console.log("Frequency of Pin " + pinNum + ": " + freq + " Hz");
      //console.log("Duty Cycle of Pin " + pinNum + ": " + dutyCycle + "%");
      returnString = "Frequency of Pin " + pinNum + ": " + freq + " Hz";
      returnString = returnString + "\n";
      returnString = returnString + "Duty Cycle of Pin " + pinNum + ": " + dutyCycle + "%"
    }
    else if(finalOutput == "Correct H L") {
      // First digital value is low
      dutyCycle = Number(firstWait) / (Number(firstWait) + Number(secondWait));

      freq = 1 / ((Number(secondWait)+Number(firstWait))/1000);

      dutyCycle = dutyCycle * 100;

      //console.log("Frequency of Pin " + pinNum + ": " + freq + " Hz");
      //console.log("Duty Cycle of Pin " + pinNum + ": " + dutyCycle + "%");
      returnString = "Frequency of Pin " + pinNum + ": " + freq + " Hz";
      returnString = returnString + "\n";
      returnString = returnString + "Duty Cycle of Pin " + pinNum + ": " + dutyCycle + "%"
    }
    else {
      //console.log(finalOutput);
      returnString = finalOutput;
    }
    return returnString;
  }

  function DetectConsoleOutput(arduinoCode) {
    // Collect all of the console prints and store into a string to compare to expected output
    let target = -1;
    let outputString = "";
    let counter = 0;
    let stringFound = "";
    do {
      // This line adds the previously detected string to the output
      outputString = outputString + stringFound;

      counter = counter + 1;
      // String to search for, returns -1 if not found, CURRENTLY CASE SENSITIVE AND PICKUPS COMMENTS
      let toSearch="Serial.print"
      // Store the index of the found string
      target = arduinoCode.indexOf(toSearch);

      // Find the index of the next existing colon, which is the end of the string
      let arduinoCodeArray = arduinoCode;
      arduinoCodeArray.split("");//.forEach(character => console.log(character));
      let index = target;
      let endIndex = target;
      while(target != -1) {
        if(arduinoCodeArray[index] == ';') {
          endIndex = index;
          break;
        }
        index = index+1;
      }
      
      //Next, check to see if the print has ln
      stringFound = "";
      let ridString = "";
      let findLN = arduinoCode.substring(target+12, target+14);
      //console.log(stringFound);
      if(findLN == "ln") {
        
        stringFound = arduinoCode.substring(target+16, endIndex-2)
        stringFound = stringFound + "\n"
        
      }
      else {
        stringFound = arduinoCode.substring(target+14, endIndex-2)
      }

      // // There are three posibilities we have to account for with the newly captured string.
      // // 1. The string captured is a string, we just need to get rid of the double quotes.
      // let exampleTest = stringFound.substring(0, 1);
      // if(exampleTest == '"') {
      //   console.log("String Captured!");
      //   // Add some code to take the double quotes off of the 
      // }
      // // 2. The string captured is a string variable, and we need to find where the variable is defined.
      // else {
      //   console.log("Variable Captured!");
      //   // 3. Possibility 2 leads to another possibility that the variable is a parameter from a function call and is defined as a different variable name.
      //   // Read arduinoCode to search for the first instance of the variable being declared.
      //     //This leads to two possibilities,
      //     // 1. We find the variable and can capture the string within the double quotes
      //     // 2. We find that the variable is a parameter of a function
      //       // From here we will have to find where the function is called.
      // }

      // Remove the detected string from arduino Code, so it isn't detected again
      ridString = arduinoCode.substring(target, endIndex+1)
      arduinoCode = arduinoCode.replace(ridString, "");
    }
    while (target != -1);

    //console.log(arduinoCode);

    return outputString;
  }

  const handleAutoSub = async () => {
    /* =========================== PLACE HOLDER =========================== */
    // The following code contains placeholders for what will eventually be filled in by variables that store
    // data in the backend.
    // These variables store the number of input and output variables.
    const numOfDigIn  = 20;
    const numOfInt    = 2;
    const numOfDigOut = 20;
    const numOfPWM    = 6;
    const numOfAnIn   = 6;
    /* =========================== PLACE HOLDER =========================== */
    
    // The following variable stores the code as a string
    let arduinoCode = getArduino(workspaceRef.current, false);
    // Print arduinoCode string
    console.log(arduinoCode);
    // Print the arduinoCode variable type
      //console.log(xtype(arduinoCode));
    //Split the string arduinoCode, into an array of characters
      //arduinoCode.split("").forEach(character => console.log(character));
    
    // The following two lines split the string into two sections with the divide being the desired string.
      //const firstPart = arduinoCode.substring(0,target);
      //const secondPart = arduinoCode.substring(target + toSearch.length, arduinoCode.length)

    // First look for number of digital inputs
    let digInCount = SearchInCode("INPUT);", arduinoCode);

    // Next look for number of interrupts
    let interruptCount = SearchInCode("attachInterrupt(", arduinoCode);

    // Next look for number of digital outputs
    let digOutCount = SearchInCode("OUTPUT);", arduinoCode);

    // Next look for number of PWM outputs
    let PWMCount = SearchInCode("analogWrite(", arduinoCode);

    // Next look for number of analog inputs
    let analogCount = SearchInCode("analogRead(", arduinoCode);
    
    let digIn = "Number of Digital Inputs: " + digInCount;
    console.log(digIn);
    let intIn = "Number of Interrupts: " + interruptCount;
    console.log(intIn);
    let digOut = "Number of Digital Outputs: " + digOutCount;
    console.log(digOut);
    let pwmOut = "Number of PWM Ouputs: " + PWMCount;
    console.log(pwmOut);
    let anaOut = "Number of Analog Outputs: " + analogCount;
    console.log(anaOut);
    let frequencyString = DetectFrequency(arduinoCode, 2);
    console.log(frequencyString);

    console.log("Printed output:");
    let outputString = DetectConsoleOutput(arduinoCode);
    console.log(outputString);

    console.log("This is the auto submit button!");
  };
  const handleVerify = async () => {
    if (showConsole || showPlotter) {
      message.warning(
        'Close Serial Monitor and Serial Plotter before uploading your code'
      );
    } else {
      // call Virtual Compiler
      const arduinoCode = getArduino(workspaceRef.current, false);
      console.log('Start');
      console.log(arduinoCode);
      console.log('End');
      
      // Compile the Arduino source code
      // Take the source code, and translate into machine code
      const result = await fetch('https://hexi.wokwi.com/build', {
        method: 'post',
        body: JSON.stringify({sketch: arduinoCode}),// This is the code we want to translate as a JSON object
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const {hex, stderr} = await result.json();
      if(!hex) { // If no hex is returned, then there was a compile error
        alert(stderr);
        return;
      }
      else {
        console.log('Compile Successful!');
      }
    }
  };

  /* =============================================================================
                                  STUDENT ADDED CODE END
     ============================================================================= */

  const handleCompile = async () => {
    console.log("HERE");
    if (showConsole || showPlotter) {
      message.warning(
        'Close Serial Monitor and Serial Plotter before uploading your code'
      );
    } else {
      if (typeof window['port'] === 'undefined') {
        await connectToPort();
      }
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setCompileError('');
      await compileArduinoCode(
        workspaceRef.current,
        setSelectedCompile,
        setCompileError,
        activity,
        false
      );
    }
  };

  const menu = (
    <Menu>
      <Menu.Item onClick={handlePlotter}>
        <PlotterLogo />
        &nbsp; Show Serial Plotter
      </Menu.Item>
      <CodeModal title={'XML'} workspaceRef={workspaceRef.current} />
      <Menu.Item>
        <CodeModal title={'Arduino Code'} workspaceRef={workspaceRef.current} />
      </Menu.Item>
    </Menu>
  );

  return (
    <div id='horizontal-container' className='flex flex-column'>
      <div className='flex flex-row'>
        <div
          id='bottom-container'
          className='flex flex-column vertical-container overflow-visible'
        >
          <Spin
            tip='Compiling Code Please Wait... It may take up to 20 seconds to compile your code.'
            className='compilePop'
            size='large'
            spinning={selectedCompile}
          >
            <Row id='icon-control-panel'>
              <Col flex='none' id='section-header'>
                Program your Arduino...
              </Col>
              <Col flex='auto'>
                <Row align='middle' justify='end' id='description-container'>
                  <Col flex={'30px'}>
                    <Row>
                      <Col>
                        <Link id='link' to={'/'} className='flex flex-column'>
                          <i className='fa fa-home fa-lg' />
                        </Link>
                      </Col>
                    </Row>
                  </Col>
                  <Col flex='auto' />

                  <Col flex={'200px'}>
                    <Row>
                      <Col className='flex flex-row'>
                        <button
                          onClick={handleUndo}
                          id='link'
                          className='flex flex-column'
                        >
                          <i
                            id='icon-btn'
                            className='fa fa-undo-alt'
                            style={
                              workspaceRef.current
                                ? workspaceRef.current.undoStack_.length < 1
                                  ? { color: 'grey', cursor: 'default' }
                                  : null
                                : null
                            }
                            onMouseEnter={() => setHoverUndo(true)}
                            onMouseLeave={() => setHoverUndo(false)}
                          />
                          {hoverUndo && (
                            <div className='popup ModalCompile4'>Undo</div>
                          )}
                        </button>
                        <button
                          onClick={handleRedo}
                          id='link'
                          className='flex flex-column'
                        >
                          <i
                            id='icon-btn'
                            className='fa fa-redo-alt'
                            style={
                              workspaceRef.current
                                ? workspaceRef.current.redoStack_.length < 1
                                  ? { color: 'grey', cursor: 'default' }
                                  : null
                                : null
                            }
                            onMouseEnter={() => setHoverRedo(true)}
                            onMouseLeave={() => setHoverRedo(false)}
                          />
                          {hoverRedo && (
                            <div className='popup ModalCompile4'>Redo</div>
                          )}
                        </button>
                      </Col>
                    </Row>
                  </Col>
                  <Col flex={'230px'}>
                    <div
                      id='action-btn-container'
                      className='flex space-around'
                    >
                      <AutoSubmit
                        setHoverAutoSub={setHoverAutoSub}
                        handleAutoSub={handleAutoSub}
                      />
                      {hoverAutoSub && (
                        <div className='popup ModalCompile'>
                          Auto submit
                        </div>
                      )}
                      <ArduinoVerify
                        setHoverVerify={setHoverVerify}
                        handleVerify={handleVerify}
                      />
                      {hoverVerify && (
                        <div className='popup ModalCompile'>
                          Verify code
                        </div>
                      )}
                      <ArduinoLogo
                        setHoverCompile={setHoverCompile}
                        handleCompile={handleCompile}
                      />
                      {hoverCompile && (
                        <div className='popup ModalCompile'>
                          Upload to Arduino
                        </div>
                      )}

                      <i
                        onClick={() => handleConsole()}
                        className='fas fa-terminal hvr-info'
                        style={{ marginLeft: '6px' }}
                        onMouseEnter={() => setHoverConsole(true)}
                        onMouseLeave={() => setHoverConsole(false)}
                      />
                      {hoverConsole && (
                        <div className='popup ModalCompile'>
                          Show Serial Monitor
                        </div>
                      )}
                      <Dropdown overlay={menu}>
                        <i className='fas fa-ellipsis-v'></i>
                      </Dropdown>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
            <div id='blockly-canvas' />
          </Spin>
        </div>
        <ConsoleModal
          show={showConsole}
          connectionOpen={connectionOpen}
          setConnectionOpen={setConnectionOpen}
        ></ConsoleModal>
        <PlotterModal
          show={showPlotter}
          connectionOpen={connectionOpen}
          setConnectionOpen={setConnectionOpen}
          plotData={plotData}
          setPlotData={setPlotData}
          plotId={plotId}
        />
      </div>

      {/* This xml is for the blocks' menu we will provide. Here are examples on how to include categories and subcategories */}
      <xml id='toolbox' is='Blockly workspace'>
        {
          // Maps out block categories
          activity &&
            activity.toolbox &&
            activity.toolbox.map(([category, blocks]) => (
              <category name={category} is='Blockly category' key={category}>
                {
                  // maps out blocks in category
                  // eslint-disable-next-line
                  blocks.map((block) => {
                    return (
                      <block
                        type={block.name}
                        is='Blockly block'
                        key={block.name}
                      />
                    );
                  })
                }
              </category>
            ))
        }
      </xml>

      {compileError && (
        <Alert
          message={compileError}
          type='error'
          closable
          onClose={(e) => setCompileError('')}
        ></Alert>
      )}
    </div>
  );
}
