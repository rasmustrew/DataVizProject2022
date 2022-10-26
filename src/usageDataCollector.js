const POLLING_RATE = 100

const data = []

class LogData  {
 constructor(mouseCoordinates, isClicked, extents) {
     this.mouseCoordinates = mouseCoordinates;
     this.isClicked = isClicked;
     this.extents = extents;
 }
}

function logData (props) {
    console.log("logging")
    let d = new LogData(props.mouseCoordinates, props.isClicked, props.extents);
    data.push(d)
}

export default logData;