const bcrypt = require("bcrypt");

const Login = function(){
  const data = require("../data");
  const ctx = {};

  ctx.all = data;

  ctx.find = async function(email, password){
    const user = data.find(data => data.email === email)
    console.log(user);

    if(!user) return false;

    try{
      if( await bcrypt.compare(password, user.password) )
        return user.email
      else
        return false;
    } catch {
      return false;
    }
  }

  ctx.new = function(user){
    console.log(user);

    let flag = 0;
    for(let i = 0; i < data.length; i++){
      const record = data[i];

      if(user.email === record.email) flag++;
    }

    if(flag == 0){
      data.push(user);
      return user
    }

    return false;
  }

  return ctx;
}

module.exports = Login()
