To use this project: 
- npm install
- npm run build (This keeps running, and builds after every change)
- Open index.html (I use webstorm, which starts a small local webserver that hosts the project)

At the bottom of index.js we define which dataset to load, and which parallel coordinate plots to show.
You can have any number of plots, you just need to add them in dist/index.html as well.

If you want to change the weights, you can do that live in the top right corner of the webpage (press the recompute button, don't reload the page)
If you want to change the default weights, these are in dist/index.html