import React = require("react")
import { Avatar, Box, Button, FormControlLabel, IconButton, List, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText, Switch, Typography } from "@material-ui/core"
import { connect, ConnectedProps } from 'react-redux'
import Cluster from "../../Utility/Data/Cluster"
import { Story } from "../../Utility/Data/Story"
import { graphLayout, Edge } from "../../Utility/graphs"

import { setSelectedClusters } from "../../Ducks/SelectedClustersDuck"
import { setClusterEdgesAction } from "../../Ducks/ClusterEdgesDuck"
import { DisplayMode, setDisplayMode } from "../../Ducks/DisplayModeDuck"
import { addClusterToStory, addStory, removeClusterFromStories, setActiveStory, setStories } from "../../Ducks/StoriesDuck"
import { RootState } from "../../Store/Store"
import FolderIcon from '@material-ui/icons/Folder';
import DeleteIcon from '@material-ui/icons/Delete';
import { StoryPreview } from "./StoryPreview"
import * as backend_utils from "../../../utils/backend-connect";
import * as frontend_utils from "../../../utils/frontend-connect";

const mapStateToProps = (state: RootState) => ({
    currentAggregation: state.currentAggregation,
    stories: state.stories,
    displayMode: state.displayMode,
    dataset: state.dataset,
    webGLView: state.webGLView,
    selectedClusters: state.selectedClusters
})

const mapDispatchToProps = dispatch => ({
    setStories: stories => dispatch(setStories(stories)),
    setActiveStory: (activeStory: Story) => dispatch(setActiveStory(activeStory)),
    setClusterEdges: clusterEdges => dispatch(setClusterEdgesAction(clusterEdges)),
    setDisplayMode: displayMode => dispatch(setDisplayMode(displayMode)),
    setSelectedClusters: value => dispatch(setSelectedClusters(value)),
    addClusterToStory: cluster => dispatch(addClusterToStory(cluster)),
    addStory: story => dispatch(addStory(story)),
    removeClusterFromStories: cluster => dispatch(removeClusterFromStories(cluster))
})

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>

type Props = PropsFromRedux & {
    open,
    backendRunning,
    clusteringWorker
}

export const ClusteringTabPanel = connector(({
    setStories,
    setActiveStory,
    currentAggregation,
    clusteringWorker,
    dataset,
    stories,
    setClusterEdges,
    setDisplayMode,
    displayMode,
    setSelectedClusters,
    addStory,
    addClusterToStory,
    removeClusterFromStories,
    webGLView,
    selectedClusters }: Props) => {


    function storyLayout(edges: Edge[]) {
        var stories: Story[] = []
        var copy = edges.slice(0)
        // hh
        while (copy.length > 0) {
            var toProcess = [copy.splice(0, 1)[0]]

            var clusters = new Set()
            var storyEdges = new Set()


            while (toProcess.length > 0) {
                var edge = toProcess.splice(0, 1)[0]
                do {
                    clusters.add(edge.source)
                    clusters.add(edge.destination)
                    storyEdges.add(edge)

                    var idx = copy.findIndex(value => value.destination == edge.source || value.source == edge.destination)
                    if (idx >= 0) {
                        var removed = copy.splice(idx, 1)[0]
                        clusters.add(removed.source)
                        clusters.add(removed.destination)
                        storyEdges.add(removed)
                        toProcess.push(removed)
                    }
                } while (idx >= 0)
            }


            stories.push(new Story([...clusters], [...storyEdges]))
        }
        return stories
    }

    function toggleClusters() {
        if (null == null) {
            console.log("toggle")
            if (dataset.clusters && dataset.clusters.length > 0) {
                let clusters = dataset.clusters

                if (dataset.clusterEdges && dataset.clusterEdges.length > 0) {
                    setClusterEdges(dataset.clusterEdges)

                    //let stories = storyLayout(dataset.clusterEdges)

                    //setStories(stories)
                    setStories([new Story(dataset.clusters, dataset.clusterEdges)])

                    //setActiveStory(stories[0])
                } else {
                    if (dataset.isSequential) {
                        const [edges] = graphLayout(clusters)

                        setClusterEdges(edges)

                        if (edges.length > 0) {
                            let stories = storyLayout(edges)

                            setStories(stories)
                            //setActiveStory(stories[0])
                        }
                    }
                }
            } else {
                let worker = new Worker(frontend_utils.BASE_PATH + 'cluster.js') //dist/

                worker.onmessage = (e) => {
                    // Point clusteruing
                    let clusters = []
                    Object.keys(e.data).forEach(k => {
                        let t = e.data[k]
                        let f = new Cluster(t.points, t.bounds, t.hull, t.triangulation)
                        f.label = k
                        clusters.push(f)
                    })


                    // Inject cluster attributes
                    clusters.forEach(cluster => {
                        let vecs = []
                        cluster.points.forEach(point => {
                            vecs.push(dataset.vectors[point.meshIndex])
                        })
                        cluster.vectors = vecs
                        cluster.points = cluster.vectors
                    })

                    if (dataset.clusterEdges && dataset.clusterEdges.length > 0) {
                        setClusterEdges(dataset.clusterEdges)

                        let stories = storyLayout(dataset.clusterEdges)

                        setStories(stories)


                        //setActiveStory(stories[0])
                    } else {
                        if (dataset.isSequential) {
                            const [edges] = graphLayout(clusters)

                            setClusterEdges(edges)

                            if (edges.length > 0) {
                                let stories = storyLayout(edges)

                                setStories(stories)
                                //setActiveStory(stories[0])
                            }
                        }
                    }
                }

                worker.postMessage({
                    type: 'extract',
                    message: dataset.vectors.map(vector => [vector.x, vector.y, vector.clusterLabel])
                })
            }
        }
    }

    function calc_hdbscan(){
        const points = dataset.vectors.map(point => [point.x, point.y]);
        backend_utils.calculate_hdbscan_clusters(points).then(data => {
            const cluster_labels = data["result"];
            const dist_cluster_labels = cluster_labels.filter((value, index, self) => {return self.indexOf(value) === index;}); //return distinct list of clusters
            
            let story = null;
            dist_cluster_labels.forEach(cluster_label => {
                const current_cluster_vects = dataset.vectors.filter((x, i) => cluster_labels[i] == cluster_label);
                const cluster = Cluster.fromSamples(current_cluster_vects);
                if(story){
                    addClusterToStory(cluster);
                }else{
                    story = new Story([cluster], []);
                    addStory(story)
                    setActiveStory(story)
                }
            });
            
        });
    }


    React.useEffect(() => toggleClusters(), [dataset])

    return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box p={2}>
            <FormControlLabel
                control={<Switch checked={displayMode == DisplayMode.OnlyClusters} onChange={(event) => {
                    setDisplayMode(event.target.checked ? DisplayMode.OnlyClusters : DisplayMode.StatesAndClusters)
                }} name="test" />}
                label="Show Clusters Only"
            />


        </Box>

        <Box p={2}>
            <Button
                variant="outlined"
                style={{
                    width: '100%'
                }}
                onClick={calc_hdbscan}>Perform HDBSCAN</Button>
        </Box>

        <Box p={2}>
            <Typography variant="h6">
                Clusters
            </Typography>
        </Box>

        <Box padding={2}>
            <StoryPreview></StoryPreview>
        </Box>


        <Box paddingLeft={2} paddingRight={2}>
            <Button
                variant="outlined"
                style={{
                    width: '100%'
                }}
                onClick={() => {
                    if (currentAggregation.length > 0) {
                        let cluster = Cluster.fromSamples(currentAggregation)

                        if (!stories.active) {
                            let story = new Story([cluster], [])
                            addStory(story)
                            setActiveStory(story)
                        } else {
                            addClusterToStory(cluster)
                        }
                    }
                }}>Add From Selection</Button>
        </Box>

        <div style={{ overflowY: 'auto', height: '100px', flex: '1 1 auto' }}>
            <List>
                {stories.active?.clusters.map((cluster, key) => {
                    return <ListItem key={key} button selected={selectedClusters.includes(cluster)} onClick={() => {
                        webGLView.current.onClusterClicked(cluster)
                    }}>
                        <ListItemAvatar>
                            <Avatar>
                                <FolderIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={`Cluster ${cluster.label}`}
                            secondary={`${cluster.vectors.length} Samples`}
                        />
                        <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete" onClick={() => {
                                removeClusterFromStories(cluster)
                            }}>
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                })
                }
            </List>
        </div>
    </div>
})