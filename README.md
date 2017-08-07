# ReStore

restore is a simple library to manage global state. it supports event subscription and event history natively out of the box. restore can be extended via middlewares.  

#### sample code for tic-tac-toe
~~~~
class TicTacToe {
      constructor() {
        this.newGame()
      }

      newGame() {
        this.board = []
        for(let i = 0; i < 5; i++) {
          this.board[i] = [0, 0, 0, 0, 0]
        }
        this._color = 'yellow';
      }

      get color() {
        return this._color;
      }

      set board(board) {
        this._color = this._color === 'yellow' ? 'blue' : 'yellow'
        this._board = board;
      }

      get board() {
        return this._board
      }

      isGameOver() {
        for(let i = 0; i < this.board.length; i++) {
            for(let j = 0; j < this.board.length; j++) {
              if(this.board[i][j] === 0) return false;
            }
        }
        return true;
      }

      hasWinner() {
        let [a, b, c, d, e] = this.board;
        return this.allSameRows()
            || this.allSameCols()
            || this.allSame(a[0], b[1], c[2], d[3], e[4])
            || this.allSame(a[4], b[3], c[2], d[1], e[0]);
      }

      allSameCols() {
        let [a, b, c, d, e] = this.board;
        for(let i = 0; i < this.board.length; i++) {
          if (this.allSame(a[i], b[i], c[i], d[i], e[i])) {
            return true;
          }
        }
        return false;
      }

      allSameRows() {
        return this.board.filter(row => this.allSame(...row)).length > 0
      }

      allSame(...tiles) {
        return tiles.reduce((x, y) => x === y ? x : 0) !== 0;
      }
    }


    let game =  new TicTacToe();
    let table = document.getElementById('table')

    // re-create table
    for(let row = 0; row < game.board.length; row++) {
      let tr = document.createElement('tr');
      for(let col = 0; col < game.board.length; col++) {
        let td = document.createElement('td');
        td.receive = function({ data, changed: { value: board, key }}) {
          if(key === 'game') {
            this.style.backgroundColor = board[row][col] || '#fff';
          }
          else if (key ==='newgame') {
            this.style.backgroundColor = '#fff'
          }
        }
        td.onclick = function () {
          if(!game.board[row][col]) {
            game.board[row][col] = game.color
            this.send({key: 'game', value: game.board})
          }
        }
        store.subscribe(td)
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    let gameSubscriber = {
        receive({data, changed: { key, value }}) {
          switch(key) {
            case 'game': {
              game.board = value;
              if(game.hasWinner() || game.isGameOver()) {
                console.log('Game Over!')
              }
              break;
            }
            case 'newgame': {
              console.log('Starting game')
              // instantiate game
              game.newGame();
              break;
            }
          }

        }
    }

    let consoleSubscriber = {
      receive({data, changed: {key, value} }) {
        if(key === 'game') {

          console.table(value)
        }
      }
    }

    let cloneBoard = {
      process(value, key) {
        console.log(value, key)
        if(key === 'game') {
          let [a, b, c, d, e] = value
          return [[...a],  [...b], [...c], [...d], [...e]];
        }
        return value
      }
    }

    store.middleware(cloneBoard);
    store.subscribe(gameSubscriber, consoleSubscriber);
    store.dispatch(dispatchNewGame)
    
~~~~
    
#### to run the demo
  - do a ```yarn install``` or ```npm install```
  - run ```npm start```
  - navigate to http://localhost:3000/tictactoe.html
    
    
    
