import { useState } from "react"
import {useNavigate} from 'react-router-dom'

const  Login =() =>{
    const navigate = useNavigate();
    const goToTableMaterial = () =>{
        navigate('/')
    };
    return <>
        <h1>Page de connexion</h1>
        <button onClick={goToTableMaterial}>Aller a la table material</button>
    
    </>
}

export default Login;