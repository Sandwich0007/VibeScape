console.log("lets write javascript");
let currentSong = new Audio();
let songs = [];
let currFolder = "ncs";
let playlistsData = [];

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder) {
  currFolder = folder;
  
  // Load the catalog if not already loaded
  if (!playlistsData.length) {
    let a = await fetch("songs.json");
    playlistsData = await a.json();
  }

  // Find the selected album
  let album = playlistsData.find((item) => item.folder === folder);
  songs = album && album.songs ? album.songs : [];

  // Show all the songs in the playlist
  let songUl = document.querySelector(".songlist").getElementsByTagName("ul")[0];
  songUl.innerHTML = "";

  if (songs.length === 0) {
    songUl.innerHTML = `<li style="justify-content: center;"><div>No songs available in this playlist</div></li>`;
    return songs;
  }

  for (const song of songs) {
    songUl.innerHTML += 
      `<li><img class="invert" src="image/music.svg" />
      <div class="info">
        <div>${song}</div>
        <div>${album.title}</div>
      </div>
      <div class="playnow">
        <span>Play Now</span>
        <img class="invert" src="image/play.svg" alt="" />
      </div></li>`;
  }

  // Add an event listener to each song
  Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach((e) => {
    e.addEventListener("click", () => {
      let track = e.querySelector(".info").firstElementChild.innerHTML.trim();
      if (track !== "No songs available in this playlist") {
        playMusic(track);
      }
    });
  });
  return songs;
}

const playMusic = (track, pause = false) => {
  if (!track) return;
  
  // Relative path to song: Works anywhere on Live Server
  currentSong.src = `Songs/${currFolder}/` + track;
  if (!pause) {
    currentSong.play();
    play.src = "image/pause.svg";
  }

  document.querySelector(".songinfo").innerHTML = track;
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  if (!playlistsData.length) {
    let a = await fetch("songs.json");
    playlistsData = await a.json();
  }

  let cardContainer = document.querySelector(".cardcontainer");
  cardContainer.innerHTML = "";

  for (const item of playlistsData) {
    cardContainer.innerHTML += 
      `<div data-folder="${item.folder}" class="card">
        <div class="play">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
        </div>
        <img src="Songs/${item.folder}/cover.jpeg" alt="${item.title}" />
        <h2>${item.title}</h2>
        <p>${item.description}</p>
      </div>`;
  }

  // Load the playlist whenever card is clicked
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      songs = await getsongs(item.currentTarget.dataset.folder);
      if (songs.length > 0) {
        playMusic(songs[0]);
      }
    });
  });
}

async function main() {
  // Display all the albums first
  await displayAlbums();

  // Load the default playlist (ncs)
  await getsongs("ncs");
  if (songs.length > 0) {
    playMusic(songs[0], true);
  }

  // Attach an event listener to play button
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "image/pause.svg";
    } else {
      currentSong.pause();
      play.src = "image/play.svg";
    }
  });

  // Track time updates
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Seekbar click handler (currentTarget fixes the circle offset jump)
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.currentTarget.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Mobile hamburger menu
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Previous button (decodeURIComponent handles spaces properly)
  previous.addEventListener("click", () => {
    console.log("previous clicked");
    let currentTrack = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
    let index = songs.indexOf(currentTrack);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  // Next button
  next.addEventListener("click", () => {
    console.log("next clicked");
    let currentTrack = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
    let index = songs.indexOf(currentTrack);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Automatically play the next song when current one finishes!
  currentSong.addEventListener("ended", () => {
    let currentTrack = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
    let index = songs.indexOf(currentTrack);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Volume slider (using 'input' for smooth dragging)
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("input", (e) => {
      currentSong.volume = parseInt(e.target.value) / 100;
      if (currentSong.volume > 0) {
        document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("image/mute.svg", "image/volume.svg");
      }
    });

  // Mute / Unmute toggle
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    let rangeInput = document.querySelector(".range").getElementsByTagName("input")[0];
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      rangeInput.value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.5;
      rangeInput.value = 50;
    }
  });
}

main();