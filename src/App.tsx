import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

type CharacterType = 'dean' | 'melody';
type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';

const TILE_SIZE = 40;
const GRAVITY = 0.5;
const FRICTION = 0.8;
const JUMP_POWER = -13;
const MOVE_SPEED = 6;

// Define a simple level
const LEVEL = [
  "                                                                                                    ",
  "                                                                                                    ",
  "                                                                                                    ",
  "                                                                                                    ",
  "                                                                                                    ",
  "             ???                                                                                    ",
  "                                                                                                    ",
  "                               B?B                  E                                               ",
  "       E                                         XXXXXX                      E                    E ",
  "XXXXXXXXXXX   XXXXXXXXXXXX                  XX                  XXXXXXXXXXXXXXXX     XXXXXXXXXXXXXXX",
  "XXXXXXXXXXX   XXXXXXXXXXXX                  XX                  XXXXXXXXXXXXXXXX     XXXXXXXXXXXXXXX",
];

// Helper to load images
const loadImage = (src: string) => {
  const img = new Image();
  img.src = src;
  return img;
};

// --- Pixel Art Rendering Helpers ---
const textureGround = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = '#B86F50'; // Brighter dirt base
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#A35E3E'; // Dirt shadow
    ctx.fillRect(x, y + 16, w, h - 16);
    ctx.fillStyle = '#824227'; // Dirt details
    ctx.fillRect(x + 4, y + 16, 8, 8);
    ctx.fillRect(x + 20, y + 28, 8, 8);
    ctx.fillRect(x + 28, y + 12, 8, 8);
    
    // Vibrant Grass
    ctx.fillStyle = '#2B9E49'; // Darker grass border
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = '#4CD565'; // Super bright grass top
    ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = '#6DEA82'; // Grass highlights
    ctx.fillRect(x + 2, y + 2, 4, 2);
    ctx.fillRect(x + 12, y + 2, 6, 2);
    ctx.fillRect(x + 24, y + 2, 4, 2);
    ctx.fillStyle = '#4CD565';
    ctx.fillRect(x + 4, y + 6, 4, 4);
    ctx.fillRect(x + 16, y + 6, 4, 4);
    ctx.fillRect(x + 28, y + 6, 4, 4);
}

const textureBrick = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = '#E85B5B'; // Vibrant brick red
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#99363B'; // Dark outline
    ctx.fillRect(x, y + 9, w, 2);
    ctx.fillRect(x, y + 19, w, 2);
    ctx.fillRect(x, y + 29, w, 2);
    ctx.fillRect(x, y + 39, w, 1);
    ctx.fillRect(x + 9, y, 2, 9);
    ctx.fillRect(x + 29, y, 2, 9);
    ctx.fillRect(x + 19, y + 11, 2, 8);
    ctx.fillRect(x + 9, y + 21, 2, 8);
    ctx.fillRect(x + 29, y + 21, 2, 8);
    ctx.fillRect(x + 19, y + 31, 2, 8);
    ctx.fillStyle = '#FF8A8A'; // Bright highlights
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y + 11, w, 2);
    ctx.fillRect(x, y + 21, w, 2);
    ctx.fillRect(x, y + 31, w, 2);
}

const textureQuestion = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean) => {
    if (!active) {
        ctx.fillStyle = '#8F563B';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#663931';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        ctx.fillStyle = '#3E231D';
        ctx.fillRect(x + 2, y + 2, 2, 2);
        ctx.fillRect(x + w - 4, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + h - 4, 2, 2);
        ctx.fillRect(x + w - 4, y + h - 4, 2, 2);
        return;
    }
    ctx.fillStyle = '#FF9C36'; // Brighter orange border
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#FFE737'; // Super bright yellow inside
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#FF9C36';
    ctx.fillRect(x + 14, y + 8, 12, 4);
    ctx.fillRect(x + 10, y + 12, 4, 4);
    ctx.fillRect(x + 26, y + 12, 4, 8);
    ctx.fillRect(x + 22, y + 16, 4, 4);
    ctx.fillRect(x + 18, y + 20, 4, 8);
    ctx.fillRect(x + 18, y + 32, 4, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 2, y + 2, w - 6, 2);
    ctx.fillRect(x + 2, y + 4, 2, h - 6);
    ctx.fillStyle = '#FF9C36';
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillRect(x + w - 5, y + 3, 2, 2);
    ctx.fillRect(x + 3, y + h - 5, 2, 2);
    ctx.fillRect(x + w - 5, y + h - 5, 2, 2);
}

const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: any) => {
    const x = enemy.x;
    const y = enemy.y;
    const w = enemy.width;
    const h = enemy.height;
    ctx.fillStyle = '#B4202A';
    ctx.fillRect(x, y + 10, w, h - 10);
    ctx.fillRect(x + 5, y + 5, w - 10, 5);
    ctx.fillStyle = '#FF3B4C'; // More vibrant angry red
    ctx.fillRect(x + 2, y + 12, w - 4, h - 14);
    ctx.fillRect(x + 7, y + 7, w - 14, 5);
    ctx.fillStyle = '#FF929D'; // Highlight
    ctx.fillRect(x + 4, y + 14, 6, 6);
    ctx.fillStyle = '#FFFFFF';
    const eyeOffset = enemy.vx > 0 ? 4 : 0;
    ctx.fillRect(x + 4 + eyeOffset, y + 16, 6, 6);
    ctx.fillRect(x + 16 + eyeOffset, y + 16, 6, 6);
    ctx.fillStyle = '#222034';
    ctx.fillRect(x + 6 + eyeOffset, y + 18, 2, 2);
    ctx.fillRect(x + 18 + eyeOffset, y + 18, 2, 2);
}

const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, cameraX: number) => {
    // Vibrant Sky Gradient Map
    ctx.fillStyle = '#4FB8FF'; // Bright Blue top
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#89D2FF'; // Lighter blue near horizon
    ctx.fillRect(0, height - 250, width, 250);
    ctx.fillStyle = '#B5E4FF'; // Whitish blue at horizon
    ctx.fillRect(0, height - 150, width, 150);

    // Fluffy Clouds (Parallax 0.2)
    const offset1 = -(cameraX * 0.2) % 400;
    ctx.fillStyle = '#FFFFFF';
    const repeat1 = Math.ceil(width / 400) + 1;
    for(let i = -1; i < repeat1; i++) {
        const x = offset1 + i * 400;
        // Big cloud
        ctx.fillRect(x + 50, 60, 100, 30);
        ctx.fillRect(x + 70, 40, 60, 30);
        ctx.fillRect(x + 30, 80, 140, 20);
        
        // Small cloud
        ctx.fillRect(x + 250, 120, 60, 20);
        ctx.fillRect(x + 260, 105, 40, 20);
        ctx.fillRect(x + 240, 130, 80, 10);
    }

    // Distant Mountains/Hills (Parallax 0.4)
    const offset2 = -(cameraX * 0.4) % 400;
    const repeat2 = Math.ceil(width / 400) + 1;
    for(let i = -1; i < repeat2; i++) {
        const x = offset2 + i * 400;
        ctx.fillStyle = '#5AABEB'; // Vibrant distant blue hills
        ctx.fillRect(x + 80, height - 180, 120, 180);
        ctx.fillRect(x + 100, height - 220, 80, 50);
        ctx.fillRect(x + 120, height - 250, 40, 50);
        
        ctx.fillStyle = '#A8DDF0'; // Snow caps/highlights
        ctx.fillRect(x + 120, height - 250, 40, 20);
        ctx.fillRect(x + 100, height - 230, 20, 20);
        ctx.fillRect(x + 160, height - 230, 20, 20);
        
        ctx.fillStyle = '#73BCEB';
        ctx.fillRect(x + 280, height - 150, 140, 150);
        ctx.fillRect(x + 310, height - 180, 80, 50);
    }
    
    // Foreground Forest/Hills (Parallax 0.7)
    const offset3 = -(cameraX * 0.7) % 200;
    const repeat3 = Math.ceil(width / 200) + 1;
    for(let i = -1; i < repeat3; i++) {
        const x = offset3 + i * 200;
        
        // Back trees/bushes
        ctx.fillStyle = '#39A356';
        ctx.fillRect(x + 40, height - 120, 60, 60);
        ctx.fillRect(x + 60, height - 140, 20, 40);
        ctx.fillRect(x + 150, height - 100, 40, 50);
        
        // Front grass hills
        ctx.fillStyle = '#4CD565';
        ctx.fillRect(x, height - 60, 200, 60);
        ctx.fillStyle = '#6DEA82'; // Hill highlight
        ctx.fillRect(x, height - 60, 200, 4);
        
        // Details
        ctx.fillStyle = '#2B9E49';
        ctx.fillRect(x + 20, height - 40, 8, 8);
        ctx.fillRect(x + 80, height - 20, 12, 8);
        ctx.fillRect(x + 140, height - 30, 8, 8);
    }
};

const textsDean = ["DIRIMU MELODY", "SATU LES SAMA AKU", "GWENCHANA", "MELODEAN JAYA JAYA JAYA"];
const textsMelody = ["HEY DEAN", "ELEUHHH", "MASASIH NEEEE", "MELODEAN JAYA JAYA JAYA"];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [character, setCharacter] = useState<CharacterType>('dean');
  const [score, setScore] = useState(0);

  const keys = useRef({
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    a: false,
    d: false,
    w: false,
    ' ': false,
  });

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;

    let animationFrameId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key as keyof typeof keys.current] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key as keyof typeof keys.current] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Load custom images (if user uploads them to /public)
    const deanImage = loadImage('/dean.png');
    const melodyImage = loadImage('/melody.png');

    let cameraX = 0;
    
    const player = {
      x: 100,
      y: 100,
      width: 30,
      height: 40,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facingRight: true,
      hurtTimer: 0,
      textIndex: -1,
      textTimer: 0,
    };

    // Parse level
    const blocks: any[] = [];
    const enemies: any[] = [];
    const coins: any[] = [];
    
    LEVEL.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char === 'X') {
          blocks.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, type: 'ground' });
        } else if (char === '?') {
          blocks.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, type: 'question', active: true });
        } else if (char === 'B') {
          blocks.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, type: 'brick' });
        } else if (char === 'E') {
          enemies.push({ x: x * TILE_SIZE, y: y * TILE_SIZE + 10, width: 30, height: 30, vx: -2, isAlive: true });
        }
      }
    });

    let currentScore = 0;

    const checkCollision = (rect1: any, rect2: any) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    };

    const update = () => {
      if (player.hurtTimer > 0) player.hurtTimer--;
      if (player.textTimer > 0) player.textTimer--;

      // Horizontal movement
      if (keys.current.ArrowLeft || keys.current.a) {
        player.vx = -MOVE_SPEED;
        player.facingRight = false;
      } else if (keys.current.ArrowRight || keys.current.d) {
        player.vx = MOVE_SPEED;
        player.facingRight = true;
      } else {
        player.vx *= FRICTION;
      }

      // Jump
      if ((keys.current.ArrowUp || keys.current.w || keys.current[' ']) && player.isGrounded) {
        player.vy = JUMP_POWER;
        player.isGrounded = false;
        player.textIndex = (player.textIndex + 1) % (character === 'dean' ? textsDean.length : textsMelody.length);
        player.textTimer = 60; // 1 second
      }

      player.vy += GRAVITY;

      // X Collision
      player.x += player.vx;
      for (let block of blocks) {
        if (checkCollision(player, block)) {
          if (player.vx > 0) {
            player.x = block.x - player.width;
            player.vx = 0;
          } else if (player.vx < 0) {
            player.x = block.x + block.width;
            player.vx = 0;
          }
        }
      }

      // Y Collision
      player.y += player.vy;
      player.isGrounded = false;
      for (let block of blocks) {
        if (checkCollision(player, block)) {
          if (player.vy > 0) {
            player.y = block.y - player.height;
            player.vy = 0;
            player.isGrounded = true;
          } else if (player.vy < 0) {
            player.y = block.y + block.height;
            player.vy = 0;
            // Hit block from below
            if (block.type === 'question' && block.active) {
              block.active = false;
              currentScore += 100;
              setScore(currentScore);
              // spawn coin animation
              coins.push({ x: block.x + 10, y: block.y - 20, vy: -5, timer: 20 });
            }
          }
        }
      }

      // Enemy update
      for (let enemy of enemies) {
        if (!enemy.isAlive) continue;
        
        enemy.x += enemy.vx;
        // Enemy reverse on block hit or fall gap
        for (let block of blocks) {
          if (checkCollision(enemy, block)) {
            if (enemy.vx > 0) {
              enemy.x = block.x - enemy.width;
              enemy.vx *= -1;
            } else if (enemy.vx < 0) {
              enemy.x = block.x + block.width;
              enemy.vx *= -1;
            }
          }
        }
        
        // Player enemy collision
        if (checkCollision(player, enemy)) {
          if (player.vy > 0 && player.y + player.height < enemy.y + 15) {
            // Stomp
            enemy.isAlive = false;
            player.vy = JUMP_POWER * 0.8;
            currentScore += 200;
            setScore(currentScore);
          } else if (player.hurtTimer === 0) {
             setGameState('GAMEOVER');
          }
        }
      }

      // Update flying coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.y += coin.vy;
        coin.timer--;
        if (coin.timer <= 0) coins.splice(i, 1);
      }

      // Camera follow
      cameraX = player.x - canvas.width / 2 + player.width / 2;
      // Clamp camera
      if (cameraX < 0) cameraX = 0;
      const maxCameraX = LEVEL[0].length * TILE_SIZE - canvas.width;
      if (cameraX > maxCameraX) cameraX = maxCameraX;

      // Death by falling
      if (player.y > canvas.height) {
        setGameState('GAMEOVER');
      }
      
      // Victory
      if (player.x > maxCameraX + 100) {
        setGameState('VICTORY');
      }
    };

    const draw = () => {
      renderBackground(ctx, canvas.width, canvas.height, cameraX);

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Draw blocks
      for (let block of blocks) {
        if (block.type === 'ground') {
          textureGround(ctx, block.x, block.y, block.width, block.height);
        } else if (block.type === 'brick') {
          textureBrick(ctx, block.x, block.y, block.width, block.height);
        } else if (block.type === 'question') {
          textureQuestion(ctx, block.x, block.y, block.width, block.height, block.active);
        }
      }

      // Draw enemies
      for (let enemy of enemies) {
        if (enemy.isAlive) {
          drawEnemy(ctx, enemy);
        }
      }

      // Draw flying coins
      for (let coin of coins) {
         ctx.fillStyle = '#FFD700';
         ctx.fillRect(coin.x + 6, coin.y + 6, 8, 8); // change to pixel box
         ctx.fillStyle = '#FBF236';
         ctx.fillRect(coin.x + 8, coin.y + 8, 4, 4);
      }

      // Draw Player
      const img = character === 'dean' ? deanImage : melodyImage;
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
         ctx.save();
         if (!player.facingRight) {
             ctx.translate(player.x * 2 + player.width, 0); // Flip horizontally
             ctx.scale(-1, 1);
         }
         // Assuming grid of roughly 6x8
         const frameW = img.naturalWidth / 6;
         const frameH = img.naturalHeight / 7;
         // Draw only the first frame (idle)
         ctx.drawImage(img, 0, 0, frameW, frameH, player.x - 10, player.y - 10, player.width + 20, player.height + 10);
         ctx.restore();
      } else {
        // Fallback: colored rectangle if image is missing
        ctx.fillStyle = character === 'dean' ? '#2244CC' : '#FF66AA';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        ctx.fillStyle = 'white';
        if (player.facingRight) {
            ctx.fillRect(player.x + 20, player.y + 5, 5, 5);
        } else {
            ctx.fillRect(player.x + 5, player.y + 5, 5, 5);
        }
      }
      
      // Draw name tag above player
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(character === 'dean' ? 'DEAN' : 'MELODY', player.x + player.width / 2, player.y - 15);

      // Draw jump speech bubble
      if (player.textTimer > 0 && player.textIndex >= 0) {
        const texts = character === 'dean' ? textsDean : textsMelody;
        const currentText = texts[player.textIndex];
        
        ctx.font = '600 12px "Pixelify Sans", "Courier New"';
        const textWidth = ctx.measureText(currentText).width;
        
        const boxWidth = textWidth + 16;
        const boxHeight = 20;
        const boxX = player.x + player.width / 2 - boxWidth / 2;
        const boxY = player.y - 44; 
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Border
        ctx.fillStyle = '#000000';
        ctx.fillRect(boxX, boxY, boxWidth, 2); 
        ctx.fillRect(boxX, boxY + boxHeight - 2, boxWidth, 2); 
        ctx.fillRect(boxX, boxY, 2, boxHeight); 
        ctx.fillRect(boxX + boxWidth - 2, boxY, 2, boxHeight); 

        // Pointer
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(player.x + player.width / 2 - 4, boxY + boxHeight - 2, 8, 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(player.x + player.width / 2 - 4, boxY + boxHeight, 2, 6);
        ctx.fillRect(player.x + player.width / 2 + 2, boxY + boxHeight, 2, 6);
        ctx.fillRect(player.x + player.width / 2 - 2, boxY + boxHeight + 4, 4, 2);

        // Draw text
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(currentText, player.x + player.width / 2, boxY + 14);
      }

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, character]);

  const handleTouchStart = (key: keyof typeof keys.current) => {
    keys.current[key] = true;
  };

  const handleTouchEnd = (key: keyof typeof keys.current) => {
    keys.current[key] = false;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-900 font-sans text-slate-100 touch-none select-none overflow-hidden">
      
      {gameState === 'START' && (
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md w-full border border-slate-700 m-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-500 mb-6 text-center tracking-tight">
            Super Adventure
          </h1>
          
          <p className="text-slate-400 mb-6 text-center text-sm leading-relaxed">
            Pilih karakter jagoanmu! <br />
            <span className="text-amber-400/90 mt-2 block">
              Untuk memunculkan sprite di game secara utuh, upload file gambar kamu dengan nama <b>dean.png</b> dan <b>melody.png</b> ke folder <b>public</b> aplikasi ini.
            </span>
          </p>

          <div className="flex gap-6 mb-8 w-full">
            <button
              onClick={() => setCharacter('dean')}
              className={`flex-1 pt-6 pb-4 px-4 rounded-xl flex flex-col items-center transition-all duration-300 ${
                character === 'dean' 
                  ? 'bg-blue-900/40 border-2 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] translate-y-[-4px]' 
                  : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700'
              }`}
            >
              <div className="w-16 h-16 bg-blue-600 mb-4 flex items-center justify-center rounded-2xl shadow-inner">
                 <span className="text-3xl">👦🏻</span>
              </div>
              <span className="font-bold text-white tracking-widest text-sm">DEAN</span>
            </button>

            <button
              onClick={() => setCharacter('melody')}
              className={`flex-1 pt-6 pb-4 px-4 rounded-xl flex flex-col items-center transition-all duration-300 ${
                character === 'melody' 
                  ? 'bg-pink-900/40 border-2 border-pink-400 shadow-[0_0_20px_rgba(219,39,119,0.4)] translate-y-[-4px]' 
                  : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700'
              }`}
            >
              <div className="w-16 h-16 bg-pink-600 mb-4 flex items-center justify-center rounded-2xl shadow-inner">
                 <span className="text-3xl">👰🏻‍♀️</span>
              </div>
              <span className="font-bold text-white tracking-widest text-sm">MELODY</span>
            </button>
          </div>

          <button
            onClick={() => setGameState('PLAYING')}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-900 font-black py-4 rounded-xl text-lg shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            MULAI BERMAIN!
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="w-full flex-1 md:max-w-[830px] flex flex-col items-center relative md:my-4 md:gap-4 justify-between md:justify-start overflow-hidden">
          {/* Header */}
          <div className="w-full flex justify-between px-6 py-3 md:py-4 text-base md:text-xl font-bold bg-slate-800/80 md:rounded-2xl md:border border-slate-700 shadow-xl backdrop-blur-sm z-10 shrink-0">
             <div className="flex items-center gap-2 md:gap-3">
                 <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
                 <span className="tracking-wide">SCORE: <span className="text-yellow-400 font-mono text-xl md:text-2xl ml-1">{score.toString().padStart(6, '0')}</span></span>
             </div>
             <div className="text-slate-400 tracking-wide flex items-center gap-2 text-xs md:text-base">
               PLAYER:
               <span className={`px-2 py-1 md:px-3 md:py-1 rounded-md ${character === 'dean' ? 'bg-blue-900/50 text-blue-300' : 'bg-pink-900/50 text-pink-300'}`}>
                 {character.toUpperCase()}
               </span>
             </div>
          </div>
          
          {/* Game Canvas Container */}
          <div className="w-full flex-1 min-h-[300px] flex items-center justify-center bg-slate-950 md:p-3 md:rounded-[2rem] shadow-2xl md:border-4 border-slate-800 relative overflow-hidden">
             <div className="relative w-full pb-[55%] md:pb-[55%] h-full max-h-[60vh] md:max-h-none"> {/* Aspect ratio container */}
               <canvas
                ref={canvasRef}
                width={800}
                height={440}
                className="absolute inset-0 w-full h-full object-contain md:object-cover bg-[#5C94FC] md:rounded-xl"
              />
             </div>
          </div>
          
          {/* Desktop Controls Info (Hidden on Mobile) */}
          <div className="hidden md:flex gap-6 mt-2 text-slate-400 text-sm font-semibold tracking-wide pb-4">
             <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl">
               <span className="flex gap-1">
                 <kbd className="bg-slate-700 px-2 py-1 rounded text-slate-200">A</kbd>
                 <kbd className="bg-slate-700 px-2 py-1 rounded text-slate-200">D</kbd>
               </span>
               Maju/Mundur
             </div>
             <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl">
               <span className="flex gap-1">
                 <kbd className="bg-slate-700 px-2 py-1 rounded text-slate-200">W</kbd>
                 <span className="text-slate-600">or</span>
                 <kbd className="bg-slate-700 px-2 py-1 rounded text-slate-200">SPACE</kbd>
               </span>
               Lompat
             </div>
          </div>

          {/* Mobile On-Screen Controls (Hidden on Desktop) */}
          <div className="w-full md:hidden flex justify-between px-6 pb-8 pt-4 bg-slate-900 z-10 shrink-0">
             {/* Left/Right Buttons */}
             <div className="flex gap-4">
                <button 
                  className="w-16 h-16 bg-slate-800/80 active:bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600 shadow-lg touch-manipulation"
                  onTouchStart={() => handleTouchStart('ArrowLeft')}
                  onTouchEnd={() => handleTouchEnd('ArrowLeft')}
                  onMouseDown={() => handleTouchStart('ArrowLeft')}
                  onMouseUp={() => handleTouchEnd('ArrowLeft')}
                  onMouseLeave={() => handleTouchEnd('ArrowLeft')}
                >
                  <ArrowLeft size={32} className="text-slate-300" />
                </button>
                <button 
                  className="w-16 h-16 bg-slate-800/80 active:bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600 shadow-lg touch-manipulation"
                  onTouchStart={() => handleTouchStart('ArrowRight')}
                  onTouchEnd={() => handleTouchEnd('ArrowRight')}
                  onMouseDown={() => handleTouchStart('ArrowRight')}
                  onMouseUp={() => handleTouchEnd('ArrowRight')}
                  onMouseLeave={() => handleTouchEnd('ArrowRight')}
                >
                  <ArrowRight size={32} className="text-slate-300" />
                </button>
             </div>

             {/* Jump Button */}
             <div className="flex">
                <button 
                  className="w-16 h-16 bg-slate-800/80 active:bg-emerald-600 rounded-full flex items-center justify-center border-2 border-slate-600 shadow-lg touch-manipulation"
                  onTouchStart={() => handleTouchStart('ArrowUp')}
                  onTouchEnd={() => handleTouchEnd('ArrowUp')}
                  onMouseDown={() => handleTouchStart('ArrowUp')}
                  onMouseUp={() => handleTouchEnd('ArrowUp')}
                  onMouseLeave={() => handleTouchEnd('ArrowUp')}
                >
                  <ArrowUp size={32} className="text-slate-300" />
                </button>
             </div>
          </div>
        </div>
      )}

      {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
        <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full border border-slate-700 text-center relative overflow-hidden m-4 z-20">
          {gameState === 'VICTORY' && <div className="absolute inset-0 bg-yellow-400/20 animate-pulse mix-blend-overlay"></div>}
          
          <h2 className={`text-5xl font-black mb-6 tracking-tighter drop-shadow-md ${gameState === 'VICTORY' ? 'text-yellow-400' : 'text-red-500'}`}>
            {gameState === 'VICTORY' ? 'LEVEL CLEAR!' : 'GAME OVER'}
          </h2>
          
          <p className="text-slate-400 mb-2 text-sm font-semibold tracking-widest uppercase">Score Akhir</p>
          <p className="text-6xl text-white mb-10 font-mono font-black drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            {score.toString().padStart(5, '0')}
          </p>
          
          <div className="w-full flex gap-3 flex-col">
             <button
              onClick={() => {
                setGameState('PLAYING');
                setScore(0);
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:-translate-y-1 shadow-lg"
             >
                <RotateCcw size={20} /> Main Ulang ({character.toUpperCase()})
             </button>

             <button
              onClick={() => {
                setGameState('START');
                setScore(0);
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition"
             >
                Ganti Karakter
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

