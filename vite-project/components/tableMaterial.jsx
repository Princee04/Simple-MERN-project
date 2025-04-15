import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import { Bar } from "react-chartjs-2";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { useForm } from "react-hook-form";
// import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { Chart as ChartJS, Colors } from "chart.js/auto";

import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaInfo,
  FaPen,
  FaUser,
} from "react-icons/fa";

import "../public/css/style.css";

import * as XLSX from "xlsx";
import devices from "../constants/constants";
// import e from "express";

Modal.setAppElement("#root");

export default function TableMaterial() {
  const [data, setData] = useState([]);
  const [dataFiltered, setDataFiltered] = useState([]);
  const [allChecked, setAllChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  // const [modalIsOpen, setModalIsOpen] = useState(false);/\
  const [expiredDevice, setExpiredDevice] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [categorySummary, setCategorySummary] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [connectedUser, setConnectedUser] = useState(false);
  const [user, setUser] = useState({
    Nom: "",
    Prenom: "",
    email: "",
    password: "",
    showPassword: false,
  });
  const devises = ["Ariary", "Dollar", "Euro"];
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const [newDevice, setNewDevice] = useState({
    name: "",
    type: "",
    purchase_date: new Date().toISOString().split("T")[0],
    current_value: { value: "", unit: "" },
    warranty_end: new Date(new Date().setFullYear(new Date().getFullYear() + 5))
      .toISOString()
      .split("T")[0],
    component: {},
  });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/devices")
      .then((response) => {
        const updatedData = response.data.map((item) => ({
          ...item,
          // component:JSON.parse(component),
          selected: false,
          component: JSON.parse(item.component),
        }));

        setData(updatedData);
        setDataFiltered(updatedData);
        generateCategorySummary(updatedData);
        checkExpiration(updatedData);
      })
      .catch((error) => console.error("Error fetching devices:", error));
  }, []);

  // useEffect(() => {
  //   if (darkMode) {
  //     document.body.classList.add("dark-mode");
  //   } else {
  //     document.body.classList.remove("dark-mode");
  //   }
  // }, [darkMode]);

  const generateCategorySummary = (devices) => {
    const summary = devices.reduce((acc, device) => {
      const category = device.type; // Utilisez `type` comme catégorie (ex: Ordinateur, Imprimante)
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    setCategorySummary(summary);
  };

  const handleModifyChange = (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Vous allez modifier une valeurs .Cette action est irréversible!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, modifier !",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .put(
            `http://localhost:5000/api/devices/${selectedDevice.id}`,
            selectedDevice
          )
          .then(() => {
            const modifiedDataDevices = data.map((value) => {
              if (value.id === selectedDevice.id) {
                return selectedDevice;
              }
              return value;
            });

            const modifiedDataFilteredDevices = dataFiltered.map((value) => {
              if (value.id === selectedDevice.id) {
                return selectedDevice;
              }
              return value;
            });

            Swal.fire({
              title: "Bien joué!",
              text: "Vos données ont été modifier avec succès.",
              icon: "success",
              timer: 11000,
              confirmButtonText: "Continuer",
            }).then(() => {
              window.location.href = "/";
              setData(modifiedDataDevices);
              setDataFiltered(modifiedDataFilteredDevices);
              generateCategorySummary(modifiedDataDevices);
            });
          })
          .catch((error) => console.error("Modification échouée", error));
      }
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/insertUser",
        user
      );
      console.log(response);

      setUser({ ...response.data.user, password: "" });
      setConnectedUser(true);
      setShowConnectionForm(false);
    } catch (error) {
      console.error(error);
      setUser({
        ...user,
        Nom: "",
        Prenom: "",
        email: "",
        password: "",
      });
      Swal.fire({
        title: "Connexion refusée",
        text: error.response.data.error,
        icon: "warning",

        confirmButtonText: "Réessayer",
      });
    }
  };

  const handleConnectionSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/checkConnection",
        user
      );

      setUser({ ...response.data.user, password: "" });
      setConnectedUser(true);
      setShowConnectionForm(false);
      // window.location = '/';
    } catch (error) {
      console.error(error);
      setUser({
        ...user,
        Nom: "",
        Prenom: "",
        email: "",
        password: "",
      });
      Swal.fire({
        title: "Connexion refusée",
        text: error.response.data.error,
        icon: "warning",

        confirmButtonText: "Réessayer",
      });
    }
  };

  const handleDelete = () => {
    if (connectedUser) {
      const selectedDevices = data.filter((item) => item.selected);
      // const allChecked = JSON.stringify(data) === JSON.stringify(selectedDevices);

      if (selectedDevices.length === 0) return;

      Swal.fire({
        title: "Êtes-vous sûr?",
        text: `Vous allez supprimer ${selectedDevices.length} élément(s). Cette action est irréversible!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Oui, supprimer !",
        cancelButtonText: "Annuler",
      }).then((result) => {
        if (result.isConfirmed) {
          const deleteRequests = allChecked
            ? [axios.delete(`http://localhost:5000/api/devices/all`)]
            : selectedDevices.map((device) =>
                axios.delete(`http://localhost:5000/api/devices/${device.id}`)
              );

          Promise.all(deleteRequests)
            .then(() => {
              const updatedData = data.filter((d) => !d.selected);
              const updatedDataFiltered = dataFiltered.filter(
                (d) => !d.selected
              );
              setData(updatedData);
              setDataFiltered(updatedDataFiltered);
              generateCategorySummary(updatedData);
              Swal.fire({
                title: "Bien joué!",
                text: "Vos données ont été supprimer.",
                icon: "success",
                timer: 11000,
                confirmButtonText: "Continuer",
              }).then(() => {
                window.location.href = "/";
                if (allChecked) setAllChecked(false);
              });
            })
            .catch((error) => console.error("Suppression échouée", error));
        }
      });
    } else {
      setShowConnectionForm(true);
    }
    const isNotEmpty = updatedDataFiltered.length > 0;
    isNotEmpty ? "" : setSearch("");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    const updatedData = data.filter(
      (device) =>
        device.name.toLowerCase().includes(value) ||
        device.type.toLowerCase().includes(value) ||
        device.id === parseInt(value) ||
        device.status.toLowerCase().includes(value)
    );
    const newCheckedState =
      updatedData.length > 0 && updatedData.every((device) => device.selected);

    setSearch(value);
    setDataFiltered(value === "" ? data : updatedData);
    setAllChecked(newCheckedState);
    generateCategorySummary(dataFiltered);
  };

  const toggleSelectAll = () => {
    const newCheckedState = !allChecked;
    const newCheckedList = dataFiltered.map((device) => ({
      ...device,
      selected: newCheckedState,
    }));
    setAllChecked(newCheckedState);
    setDataFiltered(newCheckedList);
    setData(
      data.map((checkedList) => ({
        ...checkedList,
        ...(newCheckedList.find((list) => list.id === checkedList.id) || {}),
      }))
    );
  };

  const toggleItem = (id) => {
    const updatedData = data.map((device) =>
      device.id === id ? { ...device, selected: !device.selected } : device
    );
    const updatedDataFiltered = dataFiltered.map((device) =>
      device.id === id ? { ...device, selected: !device.selected } : device
    );
    setData(updatedData);
    setDataFiltered(updatedDataFiltered);
    // console.log(dataFiltered);

    setAllChecked(updatedDataFiltered.every((device) => device.selected));
  };

  const handleFormSubmit = (e) => {
    if (connectedUser) {
      e.preventDefault();
      console.log(newDevice);

      // if(new Date(newDevice.warranty_end) < new Date(newDevice.purchase_date) )
      axios
        .post("http://localhost:5000/api/devices", newDevice)
        .then((response) => {
          setData([
            ...data,
            {
              ...newDevice,
              id: data.length === 0 ? 1 : data[data.length - 1].id + 1,
            },
          ]);
          setDataFiltered([
            ...data,
            {
              ...newDevice,
              id: data.length === 0 ? 1 : data[data.length - 1].id + 1,
            },
          ]);
          generateCategorySummary(dataFiltered);
          setNewDevice({
            name: "",
            type: "",
            purchase_date: new Date().toISOString().split("T")[0],
            current_value: "",
            warranty_end: new Date(
              new Date().setFullYear(new Date().getFullYear() + 5)
            )
              .toISOString()
              .split("T")[0],
          });

          Swal.fire({
            title: "Bien joué!",
            text: "Vos données ont été enregistrées.",
            icon: "success",
            timer: 11000,
            confirmButtonText: "Continuer",
          }).then(() => {
            window.location.href = "/";
            setShowForm(false);
          });
        })
        .catch((error) => console.error("Error adding device", error));
    } else {
      setShowConnectionForm(true);
    }
  };
  const chartData = {
    labels: Object.keys(categorySummary), // Catégories (ex: Ordinateur, Imprimante)
    datasets: [
      {
        label: "Nombre d'éléments",
        data: Object.values(categorySummary), // Nombre d'éléments dans chaque catégorie
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "grey",
        borderWidth: 1,
      },
    ],
  };

  const handleShowDetails = (device) => {
    const deviceSelected = device;
    setSelectedDevice(deviceSelected);
    console.log(deviceSelected);
    setShowDetails(true);
  };

  const handleTypeChange = (e) => {
    const typedData = e.target.value;
    const componentsList = devices[typedData].components;
    let temporaryVariable = newDevice;

    componentsList.forEach((component) => {
      temporaryVariable = {
        ...temporaryVariable,
        type: typedData,
        component: {
          ...temporaryVariable.component,
          [component.name]: component.options
            ? component.capacity
              ? { options: "", capacity: "" }
              : { options: "" }
            : { value: "" },
        },
      };
    });
    setNewDevice(temporaryVariable);
    console.log(temporaryVariable);
  };

  const handleModify = (device) => {
    const temporaryVariable = device;
    setSelectedDevice(device);
    console.log(temporaryVariable);
    !connectedUser ? setShowConnectionForm(true) : setShowModifyInput(true);
  };

  const checkExpiration = (oneDevice) => {
    const today = new Date();
    let tmpForAlert = [];

    oneDevice.forEach((device) => {
      
      if (device.status === "inactive" && device.warranty_end) {
        let warrantyEnd = new Date(device.warranty_end);
        const diffTime = warrantyEnd - today;
        const diffDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setExpiredDevice(expiredDevice.push(device));

        if (diffDay < 0)
          tmpForAlert.push(
            `Le matériel "${
              device.name
            }" a est ammortis depuis environ ${Math.abs(diffDay)} jours !`
          );
        else if (diffDay === 0)
          tmpForAlert.push(`Le matériel :${device.name} expire aujourd'hui`);

        // else tmpForAlert.push("Test alert");
      }

      devices[device.type].components.map((value) => {
        // console.log(value);

        if (value.options) {
          let index = value.options.indexOf(
            device.component[value.name].options
          );
          if (value.expirationsDate) {
            if (
              new Date().toISOString().split("T")[0] >
              new Date(value.expirationsDate[index]).toISOString().split("T")[0]
            )
              tmpForAlert.push(
                `${device.name} doit effectuer une mise a jours sur ${value.name}`
              );
          } else {
            index < value.options.length / 2
              ? tmpForAlert.push(
                  `${device.name} doit effectuer une amelioration sur ${value.name}`
                )
              : "";
          }
          if (device.component[value.name].capacity < 4)
            tmpForAlert.push(
              `${device.name} doit augmenter la capacite de ${value.name}`
            );
        }
      });
      // }
    });

    if (tmpForAlert.length > 0) {
      // Affichage d'une alerte avec SweetAlert
      Swal.fire({
        title: "Alerte sur délai des amortissements",
        html: tmpForAlert.join("</br>"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33", // Couleur pour le bouton de confirmation
        cancelButtonColor: "#3085d6", // Couleur pour le bouton d'annulation
        confirmButtonText: "Je veux voir les détails !",
        cancelButtonText: "Ok",
        background: "#f8d7da", // Arrière-plan de l'alerte
        width: "500px", // Largeur de l'alerte
      }).then((result) => {
        if (result.isConfirmed) {
          // Affichage des détails des appareils expirés
          expiredDevices.forEach((device, index) => {
            setTimeout(() => handleShowDetails(device), index * 2000);
          });
        }
      });
    }
  };

  // Fonction pour calculer le pourcentage d'amortissement
  const calculateAmortization = (device) => {
    const today = new Date();
    const warrantyEnd = new Date(device.warranty_end);
    const purchaseDate = new Date(device.purchase_date);

    // console.log(today,purchaseDate,warrantyEnd);
    let temporaryVariable = 0;
    const ammortization = Math.round(
      Math.min(
        (100 * (today - purchaseDate)) / (warrantyEnd - purchaseDate),
        100
      )
    );

    devices[device.type].components.map((value) => {
      if (value.options) {
        let index = value.options.indexOf(device.component[value.name].options);
        if (value.expirationsDate) {
          if (
            new Date().toISOString().split("T")[0] >
            new Date(value.expirationsDate[index]).toISOString().split("T")[0]
          )
            temporaryVariable = 3;
        } else {
          index < value.options.length / 2 ? (temporaryVariable += 10) : 3;
        }
      }
      if (
        parseInt(device.component[value.name].capacity) < 4
      )
        temporaryVariable += 3;
    });

    // console.log(Math.round(100 - ammortization));

    return 100 - ammortization - temporaryVariable;
  };

  const handleSort = (key) => {
    let direction = sortConfig.direction;
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      setSortConfig({ key: key, direction: "desc" });
    } else setSortConfig({ key: key, direction: "asc" });

    const sortedData = [...dataFiltered].sort((a, b) => {
      if (key === "status") {
        if (calculateAmortization(a) < calculateAmortization(b))
          return direction === "asc" ? -1 : 1;
        if (calculateAmortization(a) > calculateAmortization(b))
          return direction === "asc" ? 1 : -1;
      } else {
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setDataFiltered(sortedData);
  };

  const highlightedText = (text) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "gi");

    return text.split(regex).map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={index} className="bg-warning">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleExportExcel = () => {
    const headers = [
      "id",
      "name",
      "type",
      "Date d 'achat",
      "Prix d'achat",
      "Fin de garantie",
      "composant",
    ];
    const tableData = data.map((item) => [
      item.id,
      item.name,
      item.type,
      new Date(item.purchase_date),
      item.current_value,
      new Date(item.warranty_end),
      item.component,
    ]);

    // Ajouter les en-têtes à tableData
    const worksheetData = [headers, ...tableData];

    // Créer un worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Créer un workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Device Data");

    // Exporter le fichier Excel
    XLSX.writeFile(wb, "device_data.xlsx");

    Swal.fire({
      title: "Bien joué!",
      text: "Vos données ont été exporter...Verifiez dans votre téléchargement",
      icon: "success",
      timer: 3000,
      confirmButtonText: "Continuer",
    }).then(() => {
      window.location.href = "/";
    });
  };

  const handleSignout = () => {
    if (!connectedUser) setShowConnectionForm(true);
    else {
      Swal.fire({
        icon: "warning",
        title: "Voulez vous déconnecter?",
        showCancelButton: true,
        cancelButtonText: "Annuler",
        confirmButtonText: "Oui, je veux me déconnecter",
        confirmButtonColor: "red",
      }).then((result) => {
        if (result.isConfirmed) {
          setConnectedUser(false);
          setUser({ Nom: "", Prenom: "", email: "", password: "" });
        }
      });
    }
  };

  // const containParenthesis = (str) => {
  //   const regex = /\(.*\/.*\)/;

  //   return regex.test(str);
  // };

  // const extractValues = (str) => {
  //   const extractedValues = (str.match(/\(([^)]+\/[^)]+)\)/g) || []) // Trouver "(USB/Wi-Fi)" et "(Ethernet/4G)"
  //     .flatMap((m) => m.slice(1, -1).split("/")); // Enlever les parenthèses et diviser par "/"
  //   console.log(extractedValues);

  //   return extractedValues;
  // };

  return (
    <div className="body m-2">
      <nav className="navbar navbar-expand-md navbar-light bg-light shadow my-3 mx-3 rounded">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <a href="/">
              <div className="d-flex flex-column align-items-center">
                <img
                  src="/logo_seimad.jpg"
                  width={100}
                  height={100}
                  alt="Logo"
                />
                <h4 className="text-primary font-weight-bold mt-2">
                  Société d'équipement immobilier de Madagascar
                </h4>
              </div>
            </a>
          </div>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="d-flex">
            <div
              className="d-flex justify-content-between flex-column align-items-center mx-2"
              style={{ cursor: "pointer" }}
              onClick={() => handleSignout()}
            >
              <FaUser className="text-primary" />
              {connectedUser ? (
                <div className="btn btn-success text-white mt-2">
                  <h5>Utilisateur:</h5>
                  <h6 className="text-white">
                    {user.Nom} {user.Prenom}
                  </h6>
                  <p className="text-white">Email: {user.email}</p>
                </div>
              ) : (
                <div className="btn btn-secondary text-white">
                  Utilisateur non connecté
                </div>
              )}
            </div>

            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav d-flex flex-row justify-content-between ms-4">
                <li className="nav-item">
                  <a
                    className="nav-link btn btn-primary px-3 py-2 text-white rounded hover-shadow"
                    href="/"
                  >
                    Accueil
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link btn btn-primary mx-2 px-3 py-2 text-white rounded hover-shadow"
                    href=""
                  >
                    Services
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link btn btn-primary mx-2 px-3 py-2 text-white rounded hover-shadow"
                    href="https://facebook.com/seimad.sa"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .navbar {
          background-color: #f8f9fa !important;
        }

        .navbar-nav .nav-link {
          transition: background-color 0.3s ease;
        }

        .navbar-nav .nav-link:hover {
          background-color: #0056b3;
          color: #fff;
        }

        .text-primary {
          color: #007bff !important;
        }
      `}</style>

      <h1 className="text-center title">
        Tableau récapitulatif des Matériels Informatiques
      </h1>

      <div className="row">
        <div className="col-lg-9 col-md-12">
          <div className="d-flex justify-content-between">
            <h4>Nombre d'élément: {dataFiltered.length}</h4>
            <div></div>
            <div className="d-flex justify-content-between">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="30"
                fill="currentColor"
                className="bi bi-search"
                viewBox="0 0 16 16"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
              <div>
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder=" Rechercher un appareils ici"
                  className="form-control text-center"
                  style={{ width: "300px" }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              overflow: "scroll",
              maxHeight: "350px",
              background: "lightgrey",
            }}
            className="table-fluid"
          >
            <table
              className="table table-hover table-bordered"
              id="deviceTable"
              style={{ height: "200px" }}
            >
              <thead className="table-primary">
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={allChecked}
                    />
                  </th>
                  <th onClick={() => handleSort("id")}>
                    ID{" "}
                    {sortConfig.key === "id" ? (
                      sortConfig.direction === "asc" ? (
                        <FaSortUp />
                      ) : (
                        <FaSortDown />
                      )
                    ) : (
                      <FaSort />
                    )}
                  </th>
                  <th onClick={() => handleSort("name")}>
                    Nom{" "}
                    {sortConfig.key === "name" ? (
                      sortConfig.direction === "asc" ? (
                        <FaSortUp />
                      ) : (
                        <FaSortDown />
                      )
                    ) : (
                      <FaSort />
                    )}
                  </th>
                  <th onClick={() => handleSort("type")}>
                    Type{" "}
                    {sortConfig.key === "type" ? (
                      sortConfig.direction === "asc" ? (
                        <FaSortUp />
                      ) : (
                        <FaSortDown />
                      )
                    ) : (
                      <FaSort />
                    )}
                  </th>
                  <th onClick={() => handleSort("purchase_date")}>
                    Date d'Achat{" "}
                    {sortConfig.key === "purchase_date" ? (
                      sortConfig.direction === "asc" ? (
                        <FaSortUp />
                      ) : (
                        <FaSortDown />
                      )
                    ) : (
                      <FaSort />
                    )}
                  </th>
                  <th onClick={() => handleSort("current_value")}>
                    Prix d'Achat{" "}
                    {sortConfig.key === "current_value" ? (
                      sortConfig.direction === "asc" ? (
                        <FaSortUp />
                      ) : (
                        <FaSortDown />
                      )
                    ) : (
                      <FaSort />
                    )}
                  </th>
                  <th onClick={() => handleSort("warranty_end")}>
                    Date d'Expiration{" "}
                    {sortConfig.key === "warranty_end" ? (
                      sortConfig.direction === "asc" ? (
                        <FaSortUp />
                      ) : (
                        <FaSortDown />
                      )
                    ) : (
                      <FaSort />
                    )}
                  </th>
                  <th onClick={() => handleSort("status")}>
                    Statue{" "}
                    {sortConfig.key === "status" ? (
                      sortConfig.direction === "asc" ? (
                        <FaSortUp />
                      ) : (
                        <FaSortDown />
                      )
                    ) : (
                      <FaSort />
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dataFiltered.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Aucun matériel trouvé
                    </td>
                  </tr>
                ) : (
                  dataFiltered.map((device) => (
                    <tr
                      key={device.id}
                      onClick={() => toggleItem(device.id)}
                      className={
                        calculateAmortization(device) < 25 ? "table danger" : ""
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          onChange={() => toggleItem(device.id)}
                          checked={device.selected}
                        />
                      </td>
                      <td>{device.id}</td>
                      <td>{highlightedText(device.name)}</td>
                      <td>
                        {highlightedText(
                          device.type === "" ? "Pas de type" : device.type
                        )}
                      </td>
                      <td>
                        {new Date(device.purchase_date).toLocaleDateString()}
                      </td>
                      <td>
                        {device.current_value
                          ? `${device.current_value} ${device.devises}`
                          : "N/A"}
                      </td>
                      <td>
                        {new Date(device.warranty_end).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <div
                            className="progress"
                            style={{ background: "rgb(121, 113, 113)" }}
                          >
                            <div
                              className={`progress-bar progress-bar-striped progress-bar-animated ${
                                calculateAmortization(device) <= 0
                                  ? ""
                                  : calculateAmortization(device) <= 25
                                  ? "bg-danger"
                                  : calculateAmortization(device) <= 50
                                  ? "bg-warning"
                                  : "bg-success"
                              }`}
                              style={
                                calculateAmortization(device) > 0
                                  ? {
                                      width: `${calculateAmortization(
                                        device
                                      )}%`,
                                    }
                                  : {}
                              }
                            ></div>
                          </div>
                          <span className="text-center">{device.status}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex justify-content-between">
                          <button
                            id="info-button"
                            className="btn btn-info"
                            onClick={() => handleShowDetails(device)}
                          >
                            <FaInfo />
                          </button>
                          <button
                            id="modify-button"
                            className="btn btn-warning"
                            onClick={() => handleModify(device)}
                          >
                            <FaPen />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            className="d-flex flex-direction-column justify-content-end"
            style={{ position: "relative" }}
          >
            {dataFiltered.some((device) => device.selected) && (
              <button className="btn btn-danger" onClick={handleDelete}>
                Supprimer les ({data.filter((device) => device.selected).length}
                ) éléments sélectionnés
              </button>
            )}
            <button className="btn btn-info m-3 " onClick={handleExportExcel}>
              Exporter
            </button>
            <button
              className="btn btn-success"
              onClick={() => {
                connectedUser ? setShowForm(true) : setShowConnectionForm(true);
              }}
            >
              Ajouter
            </button>
          </div>
        </div>

        <div className="col-lg-3 col-md-12">
          <div className="row" style={{ background: "lightgrey" }}>
            <div className="col-12 p-3">
              <h3 className="text-center text-primary font-weight-bold">
                Résumé des Matériels
              </h3>
              <div className="list-group text-center">
                {Object.keys(categorySummary).map((category) => (
                  <div
                    key={category}
                    className="list-group-item d-flex justify-content-between align-items-center mb-3 rounded shadow-sm bg-light"
                  >
                    <strong className="text-dark">{category} :</strong>
                    <span className="badge bg-primary text-white">
                      {categorySummary[category]} éléments
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-12">
              <div className="">
                <h3 className="text-center text-primary font-weight-bold">
                  Répartition des catégories
                </h3>
                <div className="chart-container">
                  <Bar data={chartData} options={{ responsive: true }} />
                </div>
              </div>
            </div>

            <style jsx>{`
              .list-group-item {
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                transition: background-color 0.3s ease, transform 0.3s ease;
              }

              .list-group-item:hover {
                background-color: #e9ecef;
                transform: translateY(-2px);
              }

              .badge {
                font-size: 0.9rem;
                font-weight: bold;
              }

              .chart-container {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                height: 300px;
                padding: 20px;
                background-color: #fff;
              }

              h3 {
                font-size: 1.8rem;
                font-weight: bold;
                color: #007bff;
              }
            `}</style>
          </div>
        </div>
      </div>

      <Modal isOpen={showForm} onRequestClose={() => setShowForm(false)}>
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="modal-title">Ajouter un nouveau matériel</h2>
          <button
            className="btn btn-danger m-2"
            onClick={() => setShowForm(false)}
          >
            X
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mb-3">
          <div className="form-group">
            <label>Nom</label>
            <input
              type="text"
              className="form-control"
              value={newDevice.name}
              onChange={(e) =>
                setNewDevice({ ...newDevice, name: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              className="form-control"
              value={newDevice.type}
              onChange={handleTypeChange}
              required
            >
              <option value="">Sélectionner un appareil informatique</option>
              {Object.keys(devices).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {newDevice.type && (
              <div className="mt-3">
                <h4>Composants :</h4>
                {Object.entries(devices[newDevice.type].components).map(
                  ([index, composant]) => (
                    <div key={index} className="mb-2">
                      <label>{composant.name} :</label>

                      {/* Si c'est un champ avec des options (select) */}
                      {composant.options ? (
                        <div className="mb-3">
                          {composant.capacity && (
                            <input
                              type={composant.type || "text"}
                              value={
                                newDevice.component[composant.name]?.capacity
                              }
                              placeholder={`Entrer ${composant.name}`}
                              className="form-control"
                              onChange={(e) =>
                                setNewDevice((prev) => ({
                                  ...prev,
                                  component: {
                                    ...prev.component,
                                    [composant.name]: {
                                      ...prev.component[composant.name],
                                      capacity: e.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                          )}
                          <select
                            value={
                              newDevice.component[composant.name]?.options || ""
                            }
                            className="form-control mt-2"
                            onChange={(e) =>
                              setNewDevice((prev) => ({
                                ...prev,
                                component: {
                                  ...prev.component,
                                  [composant.name]: {
                                    ...prev.component[composant.name],
                                    options: e.target.value,
                                  },
                                },
                              }))
                            }
                          >
                            <option value="">-- Sélectionner --</option>
                            {composant.options.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <input
                          type={composant.type || "text"}
                          className="form-control"
                          placeholder={`Entrez ${composant.name}`}
                          value={
                            newDevice.component[composant.name]?.value || ""
                          }
                          onChange={(e) =>
                            setNewDevice((prev) => ({
                              ...prev,
                              component: {
                                ...prev.component,
                                [composant.name]: { value: e.target.value },
                              },
                            }))
                          }
                          required
                        />
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Date d'achat</label>
            <input
              type="date"
              className="form-control"
              value={newDevice.purchase_date}
              onChange={(e) =>
                setNewDevice({
                  ...newDevice,
                  purchase_date: e.target.value,
                  warranty_end: new Date(newDevice.warranty_end)
                    .setFullYear(new Date(e.target.value).getFullYear() + 5)
                    .toString(),
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Prix</label>
            <div className="d-flex justify-content-between">
              <input
                type="number"
                className="form-control"
                value={newDevice.current_value.value}
                onChange={(e) =>
                  setNewDevice({
                    ...newDevice,
                    current_value: {
                      ...newDevice.current_value,
                      value: e.target.value,
                    },
                  })
                }
                required
              />
              <select
                className="form-control"
                value={newDevice.current_value.unit}
                onChange={(e) =>
                  setNewDevice({
                    ...newDevice,
                    current_value: {
                      ...newDevice.current_value,
                      unit: e.target.value,
                    },
                  })
                }
                required
              >
                <option value="">Sélectionner la devise</option>
                {devises.map((devise) => (
                  <option key={devise} value={devise}>
                    {devise}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Fin de Garantie (5 ans par défaut)</label>
            <input
              type="date"
              className="form-control"
              value={newDevice.warranty_end || ""}
              onChange={(e) =>
                setNewDevice({ ...newDevice, warranty_end: e.target.value })
              }
            />
          </div>

          <div className="form-group mt-3">
            <button className="btn btn-primary" type="submit">
              Ajouter
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal alert */}
      {/* <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)}>
        <div className="container container-fluid-md">
          <h2>Alerte sur la garantie expirée</h2>
          <ul>
            {alertMessage.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
          <button
            className="btn btn-danger"
            onClick={() => setModalIsOpen(false)}
          >
            X
          </button>
        </div>
      </Modal> */}

      {showDetails && (
        <Modal
          isOpen={showDetails}
          onRequestClose={() => setShowDetails(false)}
        >
          <div className="container py-3">
            <div className="text-end">
              <button
                className="btn btn-danger mb-3"
                onClick={() => setShowDetails(false)}
              >
                X
              </button>
            </div>

            <div className="row">
              <div className="col-md-8">
                <h5>
                  <strong>Id:</strong> {selectedDevice.id}
                </h5>
                <h5>
                  <strong>Nom du Matériel:</strong> {selectedDevice.name}
                </h5>
                <h5>
                  <strong>Type:</strong> {selectedDevice.type}
                </h5>
                <h5>
                  <strong>Date d'achat:</strong>{" "}
                  {
                    new Date(selectedDevice.purchase_date)
                      .toISOString()
                      .split("T")[0]
                  }
                </h5>
                <h5>
                  <strong>Fin de garantie:</strong>{" "}
                  {
                    new Date(selectedDevice.warranty_end)
                      .toISOString()
                      .split("T")[0]
                  }
                </h5>
                <h5>
                  <strong>Prix d'achat:</strong> {selectedDevice.current_value}{" "}
                  {selectedDevice.devises}
                </h5>
                <h5>
                  <strong>État de l'Amortissement:</strong>{" "}
                  {selectedDevice.status}
                </h5>
              </div>

              <div className="col-md-4">
                <h5>Composants :</h5>
                <ul className="list-group">
                  {selectedDevice.component &&
                    Object.entries(selectedDevice.component).map(
                      ([index, value]) => (
                        <li key={index} className="list-group-item ">
                          <strong>{index}</strong>
                          <ul className="ms-3 mt-2">
                            {value.options ? (
                              value.capacity ? (
                                <li>
                                  {value.capacity} {value.options}
                                </li>
                              ) : (
                                <li>{value.options}</li>
                              )
                            ) : (
                              <li>{value.value}</li>
                            )}
                          </ul>
                        </li>
                      )
                    )}
                </ul>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showModifyInput && (
        <Modal
          isOpen={showModifyInput}
          onRequestClose={() => setShowModifyInput(false)}
        >
          <div className="container py-3">
            <div className="text-end">
              <button
                className="btn btn-danger mb-3"
                onClick={() => setShowModifyInput(false)}
              >
                X
              </button>
            </div>

            <form onSubmit={handleModifyChange}>
              <div className="row">
                <div className="col-md-8">
                  <div className="mb-3">
                    <label className="form-label">Nom du Matériel:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedDevice.name}
                      onChange={(e) =>
                        setSelectedDevice({
                          ...selectedDevice,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Type:</label>
                    <select
                      className="form-select"
                      value={selectedDevice.type}
                      onChange={(e) =>
                        setSelectedDevice({
                          ...selectedDevice,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="">Sélectionnez le type</option>
                      {Object.keys(devices).map((device) => (
                        <option value={device} key={device}>
                          {device}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date d'achat:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={selectedDevice.purchase_date.split("T")[0]}
                      onChange={(e) =>
                        setSelectedDevice({
                          ...selectedDevice,
                          purchase_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Date d'expiration (5 ans par défaut):
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={selectedDevice.warranty_end.split("T")[0]}
                      onChange={(e) =>
                        setSelectedDevice({
                          ...selectedDevice,
                          warranty_end: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Prix d'achat :</label>
                    <div className="d-flex gap-2">
                      <input
                        type="number"
                        className="form-control"
                        value={parseFloat(selectedDevice.current_value)}
                        onChange={(e) =>
                          setSelectedDevice({
                            ...selectedDevice,
                            current_value: e.target.value,
                          })
                        }
                      />
                      <select
                        className="form-select w-auto"
                        value={selectedDevice.devises}
                        onChange={(e) =>
                          setSelectedDevice({
                            ...selectedDevice,
                            devises: e.target.value,
                          })
                        }
                      >
                        <option value="">Devises</option>
                        {devises.map((devise, i) => (
                          <option key={i} value={devise}>
                            {devise}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <h5 className="text-center mb-3">Composants :</h5>
                  {Object.entries(devices[selectedDevice.type].components).map(
                    ([index, composant]) => (
                      <div key={index} className="mb-3">
                        <label className="form-label">{composant.name}:</label>
                        {composant.options ? (
                          <>
                            {composant.capacity && (
                              <input
                                className="form-control mb-2"
                                type={composant.type || "text"}
                                value={
                                  selectedDevice.component[composant.name]
                                    ?.capacity || ""
                                }
                                placeholder={`Entrer ${composant.name}`}
                                onChange={(e) =>
                                  setSelectedDevice((prev) => ({
                                    ...prev,
                                    component: {
                                      ...prev.component,
                                      [composant.name]: {
                                        ...prev.component[composant.name],
                                        capacity: e.target.value,
                                      },
                                    },
                                  }))
                                }
                              />
                            )}
                            <select
                              className="form-select"
                              value={
                                selectedDevice.component[composant.name]
                                  ?.options || ""
                              }
                              onChange={(e) =>
                                setSelectedDevice((prev) => ({
                                  ...prev,
                                  component: {
                                    ...prev.component,
                                    [composant.name]: {
                                      ...prev.component[composant.name],
                                      options: e.target.value,
                                    },
                                  },
                                }))
                              }
                              required
                            >
                              <option value="">-- Sélectionner --</option>
                              {composant.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <input
                            className="form-control"
                            type={composant.type || "text"}
                            placeholder={`Entrez ${composant.name}`}
                            value={
                              selectedDevice.component[composant.name]?.value ||
                              ""
                            }
                            onChange={(e) =>
                              setNewDevice((prev) => ({
                                ...prev,
                                component: {
                                  ...prev.component,
                                  [composant.name]: { value: e.target.value },
                                },
                              }))
                            }
                            required
                          />
                        )}
                      </div>
                    )
                  )}
                </div>

                <div className="mt-4 text-end">
                  <input
                    type="submit"
                    value="Modifier"
                    className="btn btn-warning"
                  />
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {showConnectionForm && (
        <Modal
          isOpen={showConnectionForm}
          onRequestClose={() => setShowConnectionForm(false)}
        >
          <div className="text-end mt-4">
            <button
              className="btn btn-danger"
              onClick={() => setShowConnectionForm(false)}
            >
              X
            </button>
          </div>

          <div className="container py-3">
            <h2 className="text-center mb-4">Veuillez vous connecter</h2>
            <div className="row">
              {/* Connexion */}
              <div className="col-md-6 border-end">
                <h4 className="mb-3">Déjà un compte</h4>

                <form onSubmit={handleConnectionSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Adresse e-mail:
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={user.email}
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Mot de passe:
                    </label>
                    <input
                      type={user.showPassword ? "text" : "password"}
                      className="form-control"
                      id="password"
                      value={user.password}
                      onChange={(e) =>
                        setUser({ ...user, password: e.target.value })
                      }
                      required
                    />
                    <input
                      type="checkbox"
                      onClick={() =>
                        setUser({ ...user, showPassword: !user.showPassword })
                      }
                    />
                  </div>

                  <div className="text-end">
                    <input
                      type="submit"
                      value="Se connecter"
                      className="btn btn-primary"
                    />
                  </div>
                </form>
              </div>

              {/* Inscription */}
              <div className="col-md-6">
                <h4 className="mb-3">Créer un compte</h4>

                <form onSubmit={handleRegister}>
                  <div className="mb-3">
                    <label htmlFor="firstname" className="form-label">
                      Nom:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="firstname"
                      value={user.Nom}
                      onChange={(e) =>
                        setUser({ ...user, Nom: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lastname" className="form-label">
                      Prénom:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="lastname"
                      value={user.Prenom}
                      onChange={(e) =>
                        setUser({ ...user, Prenom: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="register-email" className="form-label">
                      Adresse e-mail:
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="register-email"
                      value={user.email}
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="register-password" className="form-label">
                      Mot de passe:
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="register-password"
                      value={user.password}
                      onChange={(e) =>
                        setUser({ ...user, password: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirm-password" className="form-label">
                      Confirmer le mot de passe:
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirm-password"
                      required
                    />
                  </div>

                  <div className="text-end">
                    <input
                      type="submit"
                      value="S'inscrire"
                      className="btn btn-success"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Footer */}
      <div
        className="d-flex justify-content-between align-items-center px-4"
        style={{ background: "whitesmoke", height: "70px" }}
      >
        <h5 className="mb-0">
          Site web développé par les développeurs de l'entreprise
        </h5>
        <h1 className="mb-0">SEIMAD MADAGASCAR SA</h1>

        <h5 className="mb-0">&copy; copyright {new Date().getFullYear()}</h5>
      </div>
    </div>
  );
}
