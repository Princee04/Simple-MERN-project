import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import { Bar } from "react-chartjs-2";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { useForm } from "react-hook-form";
// import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { Chart as ChartJS } from "chart.js/auto";

import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa"; // Import des icônes pour le tri

import "../public/css/style.css";

import * as XLSX from "xlsx";
import devices from "../constants/constants";

Modal.setAppElement("#root");

export default function TableMaterial() {
  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors },
  // } = useForm();
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
  // const [darkMode, setDarkMode] = useState(
  //   window.matchMedia("(prefers-color-scheme: dark)").matches
  // );

  const [newDevice, setNewDevice] = useState({
    name: "",
    type: "",
    purchase_date: new Date().toISOString().split("T")[0],
    current_value: "",
    warranty_end: new Date(new Date().setFullYear(new Date().getFullYear() + 5))
      .toISOString()
      .split("T")[0],
    component: {},
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/devices")
      .then((response) => {
        const updatedData = response.data.map((item) => ({
          ...item,
          // component:JSON.parse(component),
          selected: false,
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

  const checkExpiration = (devices) => {
    const today = new Date();
    let tmpForAlert = [];

    devices.forEach((device) => {
      if (device.status === "inactive" && device.warranty_end) {
        let warrantyEnd = new Date(device.warranty_end);

        // if (!isNaN(warrantyEnd)) {
        const diffTime = warrantyEnd - today;
        // console.log(diffTime);

        const diffDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // console.log(diffDay);
        console.log(device);
        setExpiredDevice(expiredDevice.push(device));

        if (diffDay < 0)
          tmpForAlert.push(
            `Le matériel "${device.name}" a expiré depuis environ ${Math.abs(
              diffDay
            )} jours !`
          );
        else if (diffDay === 0)
          tmpForAlert.push(
            `Le matériel id:${device.id} nom du materiel:${device.name} expire aujourd'hui`
          );

        // else tmpForAlert.push("Test alert");
      }
      // }
    });

    if (tmpForAlert.length > 0) {
      Swal.fire({
        title: "Alerte sur delai des ammortissements",
        text: tmpForAlert.reduce((prev, cur) => `${prev} ${cur}`, ""),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Je veux voir les détails!",
        cancelButtonText: "ok",
      }).then((result) => {
        if (result.isConfirmed) {
          expiredDevice.forEach((device) => handleShowDetails(device));
        }
      });
    }
  };

  const generateCategorySummary = (devices) => {
    const summary = devices.reduce((acc, device) => {
      const category = device.type; // Utilisez `type` comme catégorie (ex: Ordinateur, Imprimante)
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    setCategorySummary(summary);
  };

  const handleDelete = () => {
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
            const updatedDataFiltered = dataFiltered.filter((d) => !d.selected);
            setData(updatedData);
            setDataFiltered(updatedDataFiltered);
            generateCategorySummary(updatedData);
            window.location.href = "/";
            if (allChecked) setAllChecked(false);
          })
          .catch((error) => console.error("Suppression échouée", error));
      }
    });
    const isNotEmpty = updatedDataFiltered.length > 0;
    isNotEmpty ? "" : setSearch("");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    const updatedData = data.filter(
      (device) =>
        device.name.toLowerCase().includes(value) ||
        device.type.toLowerCase().includes(value)
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
    e.preventDefault();
    const today = new Date();
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
          // timer: 11000,
          confirmButtonText: "Continuer",
        }).then(() => {
          window.location.href = "/";
        });

        setShowForm(false);
      })
      .catch((error) => console.error("Error adding device", error));
  };

  const chartData = {
    labels: Object.keys(categorySummary), // Catégories (ex: Ordinateur, Imprimante)
    datasets: [
      {
        label: "Nombre d'éléments",
        data: Object.values(categorySummary), // Nombre d'éléments dans chaque catégorie
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const handleShowDetails = (device) => {
    const deviceSelected = device;
    setSelectedDevice(deviceSelected);
    // console.log(deviceSelected.component);
    // console.log(JSON.parse(deviceSelected.component));

    setShowDetails(true);
  };

  const handleTypeChange = (e) => {
    const typedData = e.target.value;

    if (typedData) {
      devices[typedData].map((item) => {
        setNewDevice({
          ...newDevice,
          type: typedData,
          component: { [item.split(" (")[0]]: "" },
        });
      });
    } else newDevice.type = "";
  };
  // Fonction pour calculer le pourcentage d'amortissement
  const calculateAmortization = (device) => {
    const today = new Date();
    const warrantyEnd = new Date(device.warranty_end);
    const purchaseDate = new Date(device.purchase_date);

    // console.log(today,purchaseDate,warrantyEnd);
    const ammortization = Math.round(
      Math.min(
        (100 * (today - purchaseDate)) / (warrantyEnd - purchaseDate),
        100
      )
    );

    return 100 - ammortization;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedData = [...dataFiltered].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
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

  const containParenthesis = (str) => {
    const regex = /\(.*\/.*\)/;

    return regex.test(str);
  };

  const extractValues = (str) => {
    const extractedValues = (str.match(/\(([^)]+\/[^)]+)\)/g) || []) // Trouver "(USB/Wi-Fi)" et "(Ethernet/4G)"
      .flatMap((m) => m.slice(1, -1).split("/")); // Enlever les parenthèses et diviser par "/"
    console.log(extractedValues);

    return extractedValues;
  };

  return (
    <div className="body m-2">
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow my-3 mx-3">
        <div className="container">
          <div>
            <a href="/">
              <div className="d-flex flex-direction-column align-items-center">
                <img src="/logo_seimad.jpg" width={100} height={100} />
                <h4>Société d'équipement immobilier de Madagascar</h4>
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
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item d-flex centered">
                <a className="nav-link btn-primary" href="#">
                  Accueil
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link btn btn-primary mx-2 px-3" href="#">
                  Services
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link btn btn-primary mx-2 px-3" href="#">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <h1 className="text-center title">
        Tableau récapitulatif des Matériels Informatiques
      </h1>

      <div className="row">
        <div className="col-lg-10 col-md-12">
          <div className="d-flex justify-content-between">
            <h4>Nombre d'élément: {dataFiltered.length}</h4>
            <div className="d-flex justify-content-end">
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
                  placeholder="( Rechercher un appareils ici )"
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
              className="table table-hover text-nowrap  table-bordered m-2 p-2"
              id="deviceTable"
              style={{ height: "200px" }}
            >
              <thead className="">
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={allChecked}
                    />
                  </th>
                  <th onClick={() => handleSort("id")}>
                    ID
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
                    Nom
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
                    Type
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
                    Date d'Achat
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
                  <th>Prix d'Achat</th>
                  <th>Fin de Garantie</th>
                  <th>Amortissement</th>
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
                    <tr key={device.id} onClick={() => toggleItem(device.id)}>
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
                          ? `${device.current_value} Ar`
                          : "N/A"}
                      </td>
                      <td>
                        {new Date(device.warranty_end).toLocaleDateString()}
                      </td>
                      <td>
                        <div
                          className="progress  d-flex flex-direction-row justify-content-between"
                          style={{ background: "rgb(121, 113, 113)" }}
                        >
                          <div
                            className={
                              "progress-bar progress-bar-striped progress-bar-animated" +
                                calculateAmortization(device) <=
                              0
                                ? "bg-success"
                                : calculateAmortization(device) < 25
                                ? "bg-danger"
                                : calculateAmortization(device) < 50
                                ? "bg-warning"
                                : "bg-info "
                            }
                            style={{
                              width: `${calculateAmortization(device)}%`,
                            }}
                            role="progressbar"
                            aria-valuenow="60"
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            <div className="h6">
                              {calculateAmortization(device)}%
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          id="info-button"
                          className="btn btn-info"
                          onClick={() => handleShowDetails(device)}
                        >
                          En savoir plus
                        </button>
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
              onClick={() => setShowForm(true)}
            >
              Ajouter
            </button>
          </div>
        </div>

        <div className="col-lg-2 col-md-12">
          <div className="row p-1" style={{ background: "lightcyan" }}>
            <div className="col-12">
              <h3 className="text-center">Résumé des Matériels</h3>
              <div className="list-group text-center">
                {Object.keys(categorySummary).map((category) => (
                  <div key={category} className="list-group-item">
                    <strong>{category} :</strong> {categorySummary[category]}
                    éléments
                  </div>
                ))}
              </div>
            </div>

            <div className="col-12">
              <div className="my-4">
                <h3>Répartition des catégories</h3>
                <Bar data={chartData} options={{ responsive: true }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showForm} onRequestClose={() => setShowForm(false)}>
        <div className="d-flex justify-content-between">
          <h2>Ajouter un nouveau matériel</h2>
          <button
            className="btn btn-danger m-2"
            onClick={() => setShowForm(false)}
          >
            x
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
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
              // {...register("name",{required:'Nom du Materiel obligatoire'})}
            />
            {/* {errors.name && <div className="text-danger">
              {errors.name.message}
              </div>} */}
          </div>

          <div className="form-group">
            <label>Type</label>
            <select value={newDevice.type} onChange={handleTypeChange} required>
              <option value={""}>Sélectionner un apprareil informatique</option>
              {Object.keys(devices).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {newDevice.type && (
              <div>
                <h3>Composants :</h3>
                {devices[newDevice.type].map((composant, index) => (
                  <div key={index}>
                    <label>
                      {!containParenthesis(composant)
                        ? composant
                        : composant.split(" (")[0]}{" "}
                      :
                    </label>
                    <div>
                      {!containParenthesis(composant) && (
                        <input
                          type="text"
                          width={50}
                          placeholder={`Entrez ${composant}`}
                          value={newDevice.component[composant] || ""}
                          onChange={(e) =>
                            setNewDevice((prev) => ({
                              ...prev,
                              component: {
                                ...prev.component,
                                [composant]: `${e.target.value}`,
                              },
                            }))
                          }
                          required
                        />
                      )}

                      {containParenthesis(composant) && (
                        <select
                          // defaultValue={devices[newDevice.type][0]}
                          value={
                            newDevice.component[composant.split(" (")[0]] || ""
                          }
                          onChange={(e) =>
                            setNewDevice((prev) => ({
                              ...prev,
                              component: {
                                ...prev.component,
                                [composant.split(" (")[0]]: `${e.target.value}`,
                              },
                            }))
                          }
                          required
                        >
                          <option value={""}></option>

                          {extractValues(composant).map((item) => (
                            <option value={item} key={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* {errors.composant && <div className="text-danger">
                  {errors.composant.message}
                  </div>} */}
                    </div>
                  </div>
                ))}
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
                setNewDevice(
                  new Date(e.target.value) > new Date()
                    ? { ...newDevice }
                    : {
                        ...newDevice,
                        purchase_date: e.target.value,
                        warranty_end: new Date(
                          newDevice.warranty_end
                        ).setFullYear(
                          new Date(newDevice.purchase_date).getFullYear() + 5
                        ),
                      }
                )
              }
            />
          </div>

          <div className="form-group">
            <label>Prix</label>
            <input
              type="number"
              className="form-control"
              value={newDevice.current_value}
              onChange={(e) =>
                setNewDevice({ ...newDevice, current_value: e.target.value })
              }
              required
              // {...register("current_value",{required:'Prix exigée'})}
            />
            {/* {errors.current_value && <div className="text-danger">
                {errors.current_value.message}
                </div>} */}
          </div>

          <div className="form-group">
            <label>Fin de Garantie {"(Par défault 5 ans)"}</label>
            <input
              type="date"
              className="form-control"
              value={newDevice.warranty_end || ""}
              onChange={(e) =>
                setNewDevice(
                  // new Date(newDevice.purchase_date) > new Date(e.target.value)
                  // ? { ...newDevice }
                  { ...newDevice, warranty_end: e.target.value }
                )
              }
            />
          </div>

          <button className="btn btn-primary mt-3" type="submit">
            Ajouter
          </button>
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
            Fermer
          </button>
        </div>
      </Modal> */}

      {showDetails && (
        <Modal
          isOpen={showDetails}
          onRequestClose={() => setShowDetails(false)}
        >
          <div>
            <button
              className="btn btn-danger"
              onClick={() => setShowDetails(false)}
            >
              Fermer
            </button>
          </div>
          <div>
            <h1>Id: {selectedDevice.id}</h1>
            <h1>Nom du Matériel: {selectedDevice.name}</h1>
            <h1>
              Date d'achat:
              {
                new Date(selectedDevice.purchase_date)
                  .toISOString()
                  .split("T")[0]
              }
            </h1>
            <h1>
              Fin de garantie:
              {
                new Date(selectedDevice.warranty_end)
                  .toISOString()
                  .split("T")[0]
              }
            </h1>
            <h1>Prix d'achat: {selectedDevice.current_value}Ar </h1>
            <ol>
              Composants:
              {selectedDevice.component &&
                Object.entries(JSON.parse(selectedDevice.component)).map(
                  ([key, value]) => (
                    <li key={key}>
                      {key}:{value}
                    </li>
                  )
                )}
            </ol>
          </div>
        </Modal>
      )}
      <div
        className="d-flex justify-content-between"
        style={{ background: "whitesmoke", height: "70px" }}
      >
        <h4>Site web dévelopée par les développeurs de l'entreprise</h4>

        <h4>Copyright {new Date().getFullYear()}</h4>
      </div>
    </div>
  );
}
