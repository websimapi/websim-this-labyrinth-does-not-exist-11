import { jsxDEV } from "react/jsx-dev-runtime";
const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;
const App = () => {
  const [room] = useState(() => new WebsimSocket());
  const [view, setView] = useState("menu");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [currentLabyrinth, setCurrentLabyrinth] = useState(null);
  const [musicFile, setMusicFile] = useState(null);
  const [musicUrl, setMusicUrl] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [biomeType, setBiomeType] = useState("forest");
  const gameContainerRef = useRef(null);
  const gameEngineRef = useRef(null);
  useEffect(() => {
    import("./LabyrinthEngine.js").then((module) => {
      gameEngineRef.current = module.default;
    });
    const unsubscribe = room.collection("labyrinth").subscribe((labyrinths) => {
    });
    return () => {
      unsubscribe();
      if (gameEngineRef.current && gameEngineRef.current.cleanup) {
        gameEngineRef.current.cleanup();
      }
    };
  }, [room]);
  const handleMusicFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setMusicFile(file);
    }
  };
  const generateLabyrinth = async (e) => {
    e.preventDefault();
    if (!theme.trim()) {
      alert("Please enter a theme for your labyrinth");
      return;
    }
    setLoading(true);
    try {
      let musicFileUrl = "";
      if (musicFile) {
        setLoadingMessage("Uploading music file...");
        musicFileUrl = await websim.upload(musicFile);
        setMusicUrl(musicFileUrl);
      }
      setLoadingMessage("Generating labyrinth story...");
      const completionDescription = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a master storyteller who creates vivid, imaginative descriptions of labyrinths. 
                        Your descriptions should be atmospheric, detailed, and evocative, focusing on the environment, 
                        mood, and unique features of the labyrinth. Create a story in 3-4 paragraphs about a mysterious 
                        labyrinth that combines elements of wonder and danger. Focus on the ${biomeType} biome.`
          },
          {
            role: "user",
            content: `Create a detailed, vivid description of a labyrinth with the theme: "${theme}". 
                        This description will be used to generate an image and create a game experience.`
          }
        ]
      });
      const generatedDescription = completionDescription.content;
      setDescription(generatedDescription);
      setLoadingMessage("Generating labyrinth image...");
      const imageResult = await websim.imageGen({
        prompt: `An intricate, detailed bird's eye view of a mysterious ${biomeType} labyrinth with ${theme} theme. 
                Maze-like structure with paths, walls, and interesting features. Cinematic lighting, detailed textures. 
                Based on this description: ${generatedDescription.substring(0, 300)}...`,
        aspect_ratio: "1:1"
      });
      setLoadingMessage("Generating wall textures...");
      const wallTextureResult = await websim.imageGen({
        prompt: `A seamless wall texture for a ${biomeType} labyrinth with ${theme} theme. Close-up texture, 
                detailed, appropriate for a maze wall. Based on: ${generatedDescription.substring(0, 100)}...`,
        aspect_ratio: "1:1"
      });
      setLoadingMessage("Generating floor textures...");
      const floorTextureResult = await websim.imageGen({
        prompt: `A seamless floor/ground texture for a ${biomeType} labyrinth with ${theme} theme. Top-down view, 
                detailed texture appropriate for a maze floor. Based on: ${generatedDescription.substring(0, 100)}...`,
        aspect_ratio: "1:1"
      });
      setLoadingMessage("Creating your labyrinth...");
      const mazeSeedCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an AI that generates maze design parameters. Output ONLY a JSON object with these properties:
                        - size: number between 15-30 (maze size)
                        - complexity: number between 0.3-0.8 (how complex the maze is)
                        - seed: a random number between 1-1000
                        - loops: boolean (should maze have loops/multiple paths)
                        - secretRooms: number between 1-5 (number of secret areas)`
          },
          {
            role: "user",
            content: `Generate maze parameters that match this description: ${generatedDescription}`
          }
        ],
        json: true
      });
      const mazeParams = JSON.parse(mazeSeedCompletion.content);
      const labyrinthData = {
        theme,
        biomeType,
        description: generatedDescription,
        previewImage: imageResult.url,
        wallTexture: wallTextureResult.url,
        floorTexture: floorTextureResult.url,
        musicUrl: musicFileUrl,
        mazeParams,
        created: (/* @__PURE__ */ new Date()).toISOString()
      };
      const savedLabyrinth = await room.collection("labyrinth").create(labyrinthData);
      setCurrentLabyrinth(savedLabyrinth);
      setLoading(false);
      setView("game");
    } catch (error) {
      console.error("Error generating labyrinth:", error);
      setLoading(false);
      alert("Failed to generate labyrinth. Please try again.");
    }
  };
  const startGame = (labyrinth) => {
    setCurrentLabyrinth(labyrinth);
    setView("game");
  };
  useEffect(() => {
    if (view === "game" && currentLabyrinth && gameContainerRef.current && gameEngineRef.current) {
      gameEngineRef.current.init(gameContainerRef.current, currentLabyrinth);
    }
    return () => {
      if (view !== "game" && gameEngineRef.current && gameEngineRef.current.cleanup) {
        gameEngineRef.current.cleanup();
      }
    };
  }, [view, currentLabyrinth]);
  const renderView = () => {
    switch (view) {
      case "menu":
        return /* @__PURE__ */ jsxDEV("div", { className: "main-menu", children: [
          /* @__PURE__ */ jsxDEV("h1", { children: "This Labyrinth Does Not Exist" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 190,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "generation-form", children: [
            /* @__PURE__ */ jsxDEV("form", { onSubmit: generateLabyrinth, children: [
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "theme", children: "Labyrinth Theme" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 195,
                  columnNumber: 37
                }),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    id: "theme",
                    value: theme,
                    onChange: (e) => setTheme(e.target.value),
                    placeholder: "Ancient ruins, haunted castle, alien planet...",
                    required: true
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 196,
                    columnNumber: 37
                  }
                )
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 194,
                columnNumber: 33
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "biomeType", children: "Environment Type" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 207,
                  columnNumber: 37
                }),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    id: "biomeType",
                    value: biomeType,
                    onChange: (e) => setBiomeType(e.target.value),
                    children: [
                      /* @__PURE__ */ jsxDEV("option", { value: "forest", children: "Forest" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 213,
                        columnNumber: 41
                      }),
                      /* @__PURE__ */ jsxDEV("option", { value: "desert", children: "Desert" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 214,
                        columnNumber: 41
                      }),
                      /* @__PURE__ */ jsxDEV("option", { value: "ice", children: "Ice/Snow" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 215,
                        columnNumber: 41
                      }),
                      /* @__PURE__ */ jsxDEV("option", { value: "volcanic", children: "Volcanic" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 216,
                        columnNumber: 41
                      }),
                      /* @__PURE__ */ jsxDEV("option", { value: "crystal", children: "Crystal Cave" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 217,
                        columnNumber: 41
                      }),
                      /* @__PURE__ */ jsxDEV("option", { value: "underwater", children: "Underwater" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 218,
                        columnNumber: 41
                      }),
                      /* @__PURE__ */ jsxDEV("option", { value: "space", children: "Space Station" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 219,
                        columnNumber: 41
                      }),
                      /* @__PURE__ */ jsxDEV("option", { value: "ancient", children: "Ancient Ruins" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 220,
                        columnNumber: 41
                      })
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "<stdin>",
                    lineNumber: 208,
                    columnNumber: 37
                  }
                )
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 206,
                columnNumber: 33
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxDEV("label", { htmlFor: "musicFile", children: "Upload Music (optional)" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 225,
                  columnNumber: 37
                }),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "file",
                    id: "musicFile",
                    onChange: handleMusicFileChange,
                    accept: "audio/*"
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 226,
                    columnNumber: 37
                  }
                ),
                /* @__PURE__ */ jsxDEV("small", { children: "Supported formats: MP3, MIDI, WAV, OGG" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 232,
                  columnNumber: 37
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 224,
                columnNumber: 33
              }),
              /* @__PURE__ */ jsxDEV("button", { type: "submit", disabled: loading, children: loading ? "Generating..." : "Generate Labyrinth" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 235,
                columnNumber: 33
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 193,
              columnNumber: 29
            }),
            loading && /* @__PURE__ */ jsxDEV("div", { className: "loading-indicator", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "loading-spinner" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 242,
                columnNumber: 37
              }),
              /* @__PURE__ */ jsxDEV("p", { children: loadingMessage }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 243,
                columnNumber: 37
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 241,
              columnNumber: 33
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { marginTop: "20px", textAlign: "center" }, children: /* @__PURE__ */ jsxDEV("button", { onClick: () => setView("gallery"), children: "View Labyrinth Gallery" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 248,
              columnNumber: 33
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 247,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 192,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 189,
          columnNumber: 21
        });
      case "gallery":
        return /* @__PURE__ */ jsxDEV(LabyrinthGallery, { room, onSelectLabyrinth: startGame, onBack: () => setView("menu") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 257,
          columnNumber: 24
        });
      case "game":
        return /* @__PURE__ */ jsxDEV("div", { className: "game-container", ref: gameContainerRef, children: /* @__PURE__ */ jsxDEV("button", { className: "back-button", onClick: () => setView("menu"), children: "Exit Labyrinth" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 262,
          columnNumber: 25
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 261,
          columnNumber: 21
        });
      default:
        return /* @__PURE__ */ jsxDEV("div", { children: "Unknown view" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 269,
          columnNumber: 24
        });
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "app-container", children: renderView() }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 274,
    columnNumber: 9
  });
};
const LabyrinthGallery = ({ room, onSelectLabyrinth, onBack }) => {
  const [labyrinths, setLabyrinths] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = room.collection("labyrinth").subscribe((data) => {
      const sortedLabyrinths = [...data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setLabyrinths(sortedLabyrinths);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [room]);
  return /* @__PURE__ */ jsxDEV("div", { className: "gallery", children: [
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "1rem" }, children: [
      /* @__PURE__ */ jsxDEV("button", { onClick: onBack, children: "Back to Menu" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 301,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("h2", { children: "Labyrinth Gallery" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 302,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { width: "80px" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 303,
        columnNumber: 17
      }),
      " "
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 300,
      columnNumber: 13
    }),
    loading ? /* @__PURE__ */ jsxDEV("div", { className: "loading-indicator", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "loading-spinner" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 308,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("p", { children: "Loading labyrinths..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 309,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 307,
      columnNumber: 17
    }) : labyrinths.length === 0 ? /* @__PURE__ */ jsxDEV("p", { children: "No labyrinths have been created yet. Be the first to create one!" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 312,
      columnNumber: 17
    }) : /* @__PURE__ */ jsxDEV("div", { className: "gallery-items", children: labyrinths.map((labyrinth) => /* @__PURE__ */ jsxDEV("div", { className: "gallery-item", onClick: () => onSelectLabyrinth(labyrinth), children: [
      /* @__PURE__ */ jsxDEV("img", { src: labyrinth.previewImage, alt: labyrinth.theme }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 317,
        columnNumber: 29
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-content", children: [
        /* @__PURE__ */ jsxDEV("h3", { children: labyrinth.theme }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 319,
          columnNumber: 33
        }),
        /* @__PURE__ */ jsxDEV("p", { children: [
          labyrinth.description.substring(0, 100),
          "..."
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 320,
          columnNumber: 33
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "creator", children: [
          "Created by: ",
          labyrinth.username
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 321,
          columnNumber: 33
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 318,
        columnNumber: 29
      })
    ] }, labyrinth.id, true, {
      fileName: "<stdin>",
      lineNumber: 316,
      columnNumber: 25
    })) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 314,
      columnNumber: 17
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 299,
    columnNumber: 9
  });
};
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 333,
  columnNumber: 13
}));
