const data = []

function logData(props) {
    let logId = data.length + 1;
    props.logId = logId;
    data.push(props);
}

function saveLogData() {
    let writeable = JSON.stringify(data);
    const logFile = new File([`${writeable}`], 'logData.json');

// Download it using our function
    downloadFile(logFile);
}

function downloadFile(file) {
    // Create a link and set the URL using `createObjectURL`
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(file);
    link.download = file.name;

    // It needs to be added to the DOM so it can be clicked
    document.body.appendChild(link);
    link.click();

    // To make this work on Firefox we need to wait
    // a little while before removing it.
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.parentNode.removeChild(link);
    }, 0);
}

module.exports = {
    logData, saveLogData
};