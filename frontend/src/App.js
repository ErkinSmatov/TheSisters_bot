import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await axios.post('/api/register', { name, phone });
    console.log(response.data);
  };

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="text" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {/* <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /> */}
        <button type="submit">Зарегистрироваться</button>
      </form>
    </div>
  );
}

  export default App;

