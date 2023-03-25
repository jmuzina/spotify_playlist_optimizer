# Playlist Optimizer (Legacy)

Playlist Optimzer is an open-source web application that allows users to analyze their music listening preferences and create playlists accordingly. 

It was born out of a frequent issue I face; skipping song after song in Spotify playlists. When you have hundreds of songs in a playlist, it becomes overwhelming to remove songs you don't want to listen to anymore.

This is a naïve implementation I made when I was still very new to programming. I am currently [re-implementing this project](https://github.com/jmuzina/playlist_optimizer_frontend) with a more modern approach and a professional's programming experience.

------------------
## Features

* **Authenticate**: Authenticate with a Spotify
* **View your top tracks**: See a list of songs you've been listening to the most over a customizable time frame.
* **Create playlists**: Create new playlists using your top tracks.
* **Compare playlists**: Compare existing playlists with your top tracks.
* **Optimze playlists**: Add, remove, or keep songs to existing playlists based on your top tracks.
------------------
## Architecture
* **Backend**: This entire app is a single NodeJS server that handles user authentication and API requests, and renders interfaces using server-side rendering.
------------------
