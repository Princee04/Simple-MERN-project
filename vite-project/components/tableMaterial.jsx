import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from 'react-modal'

export default function TableMaterial(){
  const [data, setData] = useState([]);
  const [filter,setFilter] = useState("all");
  const [showForm,setShowForm] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [newDevice,setNewDevice] = useState({ name: 'Nom du Device', type: 'dell',purchase_date:"08-04-2004",current_value:2000,status:'inactive'});

  useEffect(() => {
    axios.get("http://localhost:5000/api/devices")
      .then((response) => {
        setData(response.data);
        checkExpiration(response.data);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });

  }, []);

  const checkExpiration = (devices) => {
    const today = new Date();
    devices.forEach(device => {
      // const warrantyEnd = new Date(device.warranty_end);

      if (device.status ==="inactive") {  // 7 jours avant expiration
        let temporaryEndTime = new Date(device.warranty_end);
        const diffTime =today.getMilliseconds() - temporaryEndTime.getMilliseconds();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Différence en jours
        console.log(diffTime);  
        setAlertMessage(`L'appareil "${device.name}" a expirée environs ${diffDays} jours !`);
        setModalIsOpen(true);  // Ouvrir la modale
      }
    });
  };

  const handleChange = (e) => {
    setNewDevice({ ...newDevice, [e.target.name]: e.target.value });
    // if(e.target.name === "purchase_date"){
    //   setNewDevice({ ...newDevice, warranty_end: e.target.value + 5});
    // }
  };

  // Ajouter un nouvel appareil
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(newDevice);
    
    axios.post('http://localhost:5000/api/devices', newDevice)
      .then(response => {
        console.log(response.data);
        console.log(data);
        
        setData([...data, { id: data[data.length-1].id+1, ...newDevice }]);
        setNewDevice({ name: '', type: '', status: 'active' });
        setShowForm(false);
      })
      .catch(error => console.error('Erreur lors de l\'ajout:', error));
      // console.log("Log frm handlesubmit");
      
  };

    return (
        <>
        <table className="table table-bordered table-striped" style={{overflow:'scroll',maxHeight:'50px'}}>
        <thead>
          <tr>
            <th>Id</th>
            <th>Nom du materiel</th>
            <th>Type</th>
            <th>Date d'achat</th>
            <th>Fin de garantie</th>
            {/* <th style={{width:'10px'}}>Duree ammortisement</th> */}
            <th>Etats Ammortissement</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {
            data.map(value =>(
              <tr key={value.id}>
                <td>{value.id}</td>
                <td>{value.name}</td>
                <td>{value.type}</td>
                <td>{new Date(value.purchase_date).getFullYear()}</td>
                <td>{new Date(value.warranty_end).getFullYear()}</td>
                {/* <td>{value.depreciation_rate}</td>
                <td>{value.current_value}</td>
                <td>{value.status}</td> */}
                <td>

                  <div className="progress progress-xs">
                    <div className="progress-bar bg-success" style={{width:'50%'}}></div>
                  </div>

                </td>
                <td className="bg-light">
                  <div className="btn btn-warning" onClick={()=>{}}>En Savoir plus</div>
                </td>
              </tr>
            ))
          }
        </tbody>
        </table>

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          contentLabel="Alerte d'expiration"
          ariaHideApp={false}  // Pour éviter un avertissement
        >

            <h2>Alerte</h2>
           <p>{alertMessage}</p>
           <button onClick={() => setModalIsOpen(false)}>Fermer</button>
      </Modal>

        {/* <div className="position-fixed bottom-0 end-0 mx-auto">
        <div className="btn-group">
            <button className="btn btn-success">Ajouter</button>
            <button className="btn btn-danger">Supprimer</button>
            <button className="btn btn-primary">Modifier</button>

        </div>
        </div> */}
         <button className="btn btn-success mb-3" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Fermer" : "Ajouter un appareil"}
      </button>

      {/* Formulaire d'ajout */}
    
        <Modal  isOpen={showForm}
          onRequestClose={() => setShowForm(false)}
          contentLabel="Ajout de Materiel"
          ariaHideApp={false} 
          >
          <div className="card p-3 mb-3">
            <div className="d-flex ms-auto">
               <h4>Ajouter un nouvel appareil</h4>
               <button className="bg-danger" onClick={() =>{setShowForm(false)}}>x</button>
            </div>

          <div className="container container-fluid">
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label>Nom :</label>
              <input type="text" name="name" className="form-control" value={newDevice.name} onChange={handleChange} required />
            </div>
            <div className="mb-2">
              <label>Type :</label>
              <input type="text" name="type" className="form-control" value={newDevice.type} onChange={handleChange} required />
            </div>
            <div className="mb-2">
              <label>Date d'achat</label>
              <input type="date" name="purchase_date" className="form-control" value={newDevice.purchase_date} onChange={handleChange} required />
            </div>

            <div className="mb-2">
              <label>Prix:</label>
              <input type="number" name="current_value" className="form-control" value={newDevice.current_value} onChange={handleChange} required />
            </div>

            <div className="mb-2">
              <label>État :</label>
              <select name="status" className="form-select" value={newDevice.status} onChange={handleChange}>
                <option value="active">Fonctionnel</option>
                <option value="inactive">À mettre à jour</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Ajouter</button>
          </form>
          </div>
        </div>
        </Modal>
        </>
    )
}