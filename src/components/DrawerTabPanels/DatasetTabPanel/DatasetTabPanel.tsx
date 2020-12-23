import React = require("react");
import { Vect } from "../../Utility/Data/Vect";
import { CSVLoader } from "../../Utility/Loaders/CSVLoader";
import { JSONLoader } from "../../Utility/Loaders/JSONLoader";
import { SDFLoader } from "../../Utility/Loaders/SDFLoader";
import { DatasetDrop } from "./DatasetDrop";
import { DownloadJob } from "./DownloadJob";
import { DownloadProgress } from "./DownloadProgress";
import { PredefinedDatasets } from "./PredefinedDatasets";
import { SDFModifierDialog } from "./SDFModifierDialog";
var d3v5 = require('d3')

function convertFromCSV(vectors) {
    return vectors.map(vector => {
        return new Vect(vector)
    })
}

export function DatasetTabPanel({ onDataSelected }) {
    const [job, setJob] = React.useState(null)
    const [entry, setEntry] = React.useState(null);
    const [openSDFDialog, setOpen] = React.useState(false);

    function onModifierDialogClose(modifiers){
        setOpen(false); 
        if(modifiers !== null)
            new SDFLoader().resolvePath(entry, onDataSelected, modifiers);
    }

    return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DatasetDrop onChange={onDataSelected}></DatasetDrop>

        <PredefinedDatasets onChange={(entry) => {
            if(entry.path.endsWith('sdf')){
                setEntry(entry);
                setOpen(true);
            }else{
                setJob(new DownloadJob(entry))
            }
        }} ></PredefinedDatasets>

        <DownloadProgress job={job} onFinish={(result) => {
            if (job.entry.path.endsWith('json')) {
                new JSONLoader().resolve(JSON.parse(result), onDataSelected, job.entry.type, job.entry)
            } else {
                new CSVLoader().resolve(onDataSelected, convertFromCSV(d3v5.csvParse(result)), job.entry.type, job.entry)
            }

            setJob(null)
        }} onCancel={() => { setJob(null) }}></DownloadProgress>

        <SDFModifierDialog openSDFDialog={openSDFDialog} handleClose={onModifierDialogClose}></SDFModifierDialog>
    </div>
}

