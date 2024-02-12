const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const dbPath = path.join(__dirname, 'userData.db')
const app = express()
app.use(express.json())
let db = null
const startDbAndUser = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is up and running ...')
    })
  } catch (e) {
    console.log(`Database Error: ${e}`)
  }
}
startDbAndUser()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const checkUserExists = `
        SELECT *
        FROM user 
        WHERE 
            username == '${username}';
    `
  const user = await db.get(checkUserExists)
  if (user === undefined) {
    //user doesn't exists
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const postQuery = `
                INSERT INTO 
                    user (username, name, password, gender, location)
                VALUES 
                    (
                        '${username}',
                        '${name}',
                        '${hashedPassword}',
                        '${gender}',
                        '${location}'
                    );
                
            `
      await db.run(postQuery)
      response.send('User created successfully')
    }
    //
  } else {
    //
    response.status(400)
    response.send('User already exists')
    //
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const checkUser = `
    SELECT *
    FROM user
    WHERE 
      username == '${username}';
  `
  const user = await db.get(checkUser)
  if (user == undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (isPasswordCorrect) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkUser = `
    SELECT *
    FROM user 
    WHERE 
      username == '${username}';
  `
  const dbUser = await db.get(checkUser)
  const isPasswordCorrect = await bcrypt.compare(oldPassword, dbUser.password)
  if (isPasswordCorrect) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const changePassword = await bcrypt.hash(newPassword, 15)
      const updateQuery = `
        UPDATE 
          user 
        SET 
          password = '${changePassword}'
        WHERE 
          username = '${username}';
      `
      await db.run(updateQuery)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
