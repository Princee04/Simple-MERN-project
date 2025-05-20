import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import Modal from "react-modal";
import { Bar } from "react-chartjs-2";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { Chart as ChartJS, Colors } from "chart.js/auto";
import { io } from "socket.io-client";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaInfo,
  FaPen,
  FaUser,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaBell,
  FaPaperclip,
  FaTrash,
} from "react-icons/fa";

import * as XLSX from "xlsx";
import {
  isComponent,
  isComponentCapacity,
  isComponentOptions,
  isComponentOtherOptions,
  showOptions,
  showOtherOptions,
  showProperty,
  showType,
} from "../functions/functions";
import devices from "../../../constants/constants";

Modal.setAppElement("#root");

export default function TableMaterial() {
  const [data, setData] = useState([]);
  const [dataFiltered, setDataFiltered] = useState([]);

  const [allChecked, setAllChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expiredDevice, setExpiredDevice] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [categorySummary, setCategorySummary] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [confirmedCode, setConfirmedCode] = useState(false);
  const [connectedUser, setConnectedUser] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchLog, setSearchLog] = useState("");
  const [logFiltered, setLogFiltered] = useState([]);
  const [deviceFilter, setDeviceFiltered] = useState("all");
  const [logFilterOption, setLogFilterOption] = useState("all");
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [personnals, setPersonals] = useState({
    newPersonal: {},
    allPersonals: [],
  }); //true
  const [sortLogConfig, setSortLogConfig] = useState({
    key: "user",
    direction: "asc",
  });

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isloading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState({
    Nom: "",
    Prenom: "",
    email: "",
    password: "",
    code: "",
    secondPassword: "",
    showPassword: false,
    forgotedPassword: false,
  });
  const devises = ["Ariary", "Dollar", "Euro"];
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const [newDevice, setNewDevice] = useState({
    id: 1,
    name: "",
    type: "",
    // purchase_date: new Date().toISOString().split("T")[0],
    current_value: "",
    // quantity: 1,
    // devises: "Ariary",
    // warranty_end: "",
    // providerName: "",
    // facture: "",
    component: {},
    extraComponent: [],
  });

  const [insertDevices, setInsertDevices] = useState({
    personnals,
    devices: [newDevice],
  });

  const calculateAmortization = (device) => {
    if (device) {
      const today = new Date();
      const warrantyEnd = new Date(device.warranty_end);
      const purchaseDate = new Date(device.purchase_date);
      let ammortizationValue = {};
      let temporaryVariable = 0;

      const ammortization = Math.round(
        Math.min(
          (100 * (today - purchaseDate)) / (warrantyEnd - purchaseDate),
          100
        )
      );

      ammortizationValue.value = ammortization;
      device.type &&
        devices[device.type].components.map((value) => {
          if (value.options) {
            let index = value.options.indexOf(
              device.component[value.name].options
            );
            if (value.expirationsDate) {
              if (new Date() > new Date(value.expirationsDate[index]))
                temporaryVariable = 5;
            } else {
              value.options.length / 2 >= 5 && index < value.options.length / 2
                ? (temporaryVariable += 5)
                : 0;
            }
          }
          if (
            value.name === "RAM" &&
            parseInt(device.component[value.name].capacity) < 4
          )
            temporaryVariable += 5;
        });

      ammortizationValue.component = temporaryVariable;
      return 100 - ammortization - temporaryVariable;
    }
  };

  const isSocketInitialized = useRef(false);

  const filteredDevices = useMemo(() => {
    let newDevices;

    if (deviceFilter === "all") newDevices = dataFiltered;
    else if (deviceFilter === "expiredOnly")
      newDevices = dataFiltered.filter((d) => calculateAmortization(d) < 25);
    else
      newDevices = dataFiltered.filter((d) => calculateAmortization(d) >= 25);
    console.log(newDevices);

    return newDevices;
  }, [deviceFilter, dataFiltered]);

  useEffect(() => {
    console.log("Rendu du composant à", new Date());
  }, []);

  // const realTime = true;

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/devices/devices")
      .then((response) => {
        const updatedData = response.data.map((item) => ({
          ...item,
          // component:JSON.parse(component),
          selected: false,
          component: JSON.parse(item.component),
        }));

        if (updatedData.length > 0) {
          setData(updatedData);
          setDataFiltered(updatedData);
          generateCategorySummary(updatedData);
          checkExpiration(updatedData);
        }
      })
      .catch((error) => console.error("Error fetching devices:", error));

    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      axios
        .post("http://localhost:5000/api/user/checkConnection", storedUser)
        .then((response) => {
          if (!response.data.error) {
            setUser({ ...storedUser, password: "" });
            setConnectedUser(true);
          }
        });
    }
    const showLogs = async () => {
      await axios
        .get("http://localhost:5000/api/logs/showlogs")
        .then((response) => {
          if (!response.data.error) {
            let tmpLogs = response.data.map((log) => ({
              ...log,
              user: JSON.parse(log.user),
              device: JSON.parse(log.device),
            }));
            setLogs(tmpLogs);
            setLogFiltered(tmpLogs);
          } else
            Swal.fire({
              title: "Erreur lors de chargement des logs",
              text: response.data.error,
            });
        });
    };

    showLogs();
    handleShowNotifications();
  }, []);

  const handleDeviceUpdate = useCallback(({ device, type }) => {
    if (type === "Modification") {
      const updateItems = (list) =>
        list.map((item) =>
          item.id === device.id
            ? { ...item, ...device, component: device.component }
            : item
        );

      setData(updateItems);
      setDataFiltered(updateItems);
      setSelectedDevice((prev) => (device.id === prev?.id ? device : prev));
    } else if (type === "deleteAll") {
      setData([]);
      setDataFiltered([]);
      setSelectedDevice(null);
    } else if (type === "delete") {
      setData((prev) => prev.filter((item) => !device.id.includes(item.id)));
      setDataFiltered((prev) =>
        prev.filter((item) => !device.id.includes(item.id))
      );
      setSelectedDevice((prev) => (device.id.includes(prev?.id) ? null : prev));
    } else {
      const newDevices = Array.isArray(device) ? device : [device];
      setData((prev) => [...newDevices, ...prev]);
      setDataFiltered((prev) => [...newDevices, ...prev]);
    }
  }, []);

  const handleLogUpdate = useCallback(({ type, log }) => {
    if (type === "delete") {
      setLogs((oneLog) => oneLog.filter((value) => value.id != log.id));
      setLogFiltered((oneLog) => oneLog.filter((value) => value.id != log.id));
    } else {
      setLogs((prev) => [log, ...prev]);
      setLogFiltered((prev) => [log, ...prev]);
    }
  }, []);
  const realTime = useRef(false);

  if (realTime.current) {
    const socket = io("http://localhost:5000");
    useEffect(() => {
      socket.on("deviceUpdated", handleDeviceUpdate);
      socket.on("logChanged", handleLogUpdate);
      socket.on("notificationChanged", ({ id, notification }) => {
        id &&
          setNotifications((prev) =>
            prev.filter((value) => value.user.id != id)
          );
        notification && setNotifications((prev) => [notification, ...prev]);
      });
      isSocketInitialized.current = true;
      return () => {
        socket.off("deviceUpdated", handleDeviceUpdate);
        socket.off("logChanged", handleLogUpdate);
        socket.off("notificationChanged");
      };
    }, [handleDeviceUpdate, handleLogUpdate]);
  }

  useEffect(() => {
    setAllChecked(filteredDevices.every((d) => d.selected));
  }, [filteredDevices]);

  // useEffect(() => {
  //   const newCheckedState =
  //     filteredDevices.length > 0 && filteredDevices.every((d) => d.selected);
  //   setAllChecked(newCheckedState);
  // }, [filteredDevices]);

  useEffect(() => {
    if (isloading) {
      Swal.fire({
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        timer: 4000,
      });
    }
  }, [isloading]);

  const generateCategorySummary = (devices) => {
    const summary = devices.reduce((acc, device) => {
      const category = device.type; // Utilisez `type` comme catégorie (ex: Ordinateur, Imprimante)
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    setCategorySummary(summary);
  };

  const printDate = (date) => {
    return (
      new Date(date).getFullYear() +
      "-" +
      String(new Date(date).getMonth() + 1).padStart(2, "0") +
      "-" +
      String(new Date(date).getDate()).padStart(2, "0") +
      " " +
      String(new Date(date).getHours()).padStart(2, "0") +
      ":" +
      String(new Date(date).getMinutes()).padStart(2, "0") +
      ":" +
      String(new Date(date).getSeconds()).padStart(2, "0")
    );
  };

  const handleModifyChange = (e) => {
    e.preventDefault();
    let hasChanged = false;
    let log = `(${user.Nom}, ${user.Prenom}, ${user.email}) a modifié (id:${
      selectedDevice.id
    }, Nom:${selectedDevice.name}, Type:${selectedDevice.type}) ce ${
      new Date().toLocaleDateString().split("T")[0]
    }) \n`;

    const modifiedDataDevices = data.map((value) => {
      if (value.id === selectedDevice.id) {
        const differences = isSameObject(value, selectedDevice);
        if (differences) {
          hasChanged = true;
          log += `\n${differences}\n`;
        }
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

    if (hasChanged) {
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
          setIsLoading(true);
          axios
            .put(
              `http://localhost:5000/api/devices/devices/${selectedDevice.id}`,
              selectedDevice
            )
            .then(async () => {
              await handlePostLog(log, "Modification", selectedDevice);
              Swal.fire({
                title: "Bien joué!",
                text: "Vos données ont été modifier avec succès.",
                icon: "success",
                timer: 5000,
                confirmButtonText: "Continuer",
              }).then(() => {
                setData(modifiedDataDevices);
                setDataFiltered(modifiedDataFilteredDevices);
                generateCategorySummary(modifiedDataDevices);
              });
            })
            .catch((error) => console.error("Modification échouée", error))
            .finally(() => setIsLoading(false));
        }
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "Aucun modification faite",
        html: `<h4 className='bg-info'>Vous n'avez pas faites de modification?</h4>`,
      });
    }
  };

  const handleFormSubmit = async (e) => {
    if (connectedUser) {
      e.preventDefault();
      newDevice;
      try {
        setIsLoading(true);

        const response = await axios.post(
          "http://localhost:5000/api/devices/devices",
          newDevice
        );

        let updatedData = response.data.insertedDevices;
        let newlogs = [];

        // handleSort(sortConfig.key);
        for (let i = 0; i < newDevice.quantity; i++) {
          const log = `(${user.Nom}, ${user.Prenom}, ${
            user.email
          }) a inserer (Nom:${newDevice.name}, Type:${
            newDevice.type
          }) ce ${new Date().toString()})`;

          await handlePostLog(log, "Ajout", newDevice);
          newlogs.push({
            type: "Ajout",
            name: log,
            date: new Date().toISOString(),
            device: newDevice,
            user: user,
          });
        }
        updatedData = Array.isArray(updatedData) ? updatedData : [updatedData];
        setData((prev) => [...updatedData, ...prev]);
        setDataFiltered((prev) => [...updatedData, ...prev]);
        generateCategorySummary(dataFiltered);
        setNewDevice({
          name: "",
          type: "",
          purchase_date: new Date().toISOString().split("T")[0],
          current_value: "",
          quantity: 1,
          devises: "Ariary",
          warranty_end: "",
          providerName: "",
          facture: "",
          component: {},
        });

        Swal.fire({
          title: "Bien joué!",
          text: "Vos données ont été enregistrées.",
          icon: "success",
          timer: 1500,
          confirmButtonText: "Continuer",
        }).then(() => {
          // window.location.href = "/";
          setShowForm(false);
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowConnectionForm(true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (confirmedCode && user.password === user.secondPassword) {
      try {
        setIsLoading(true);

        const response = await axios.post(
          "http://localhost:5000/api/user/insertUser",
          user
        );
        response.data;

        setShowConnectionForm(false);
        setIsCodeSent(false);

        Swal.fire({
          title: "Demande d'inscription envoyée au administrateur",
          text: "Veuillez contacter votre administrateur",
          confirmButtonText: "ok",
          timer: 2000,
        });
      } catch (error) {
        console.error(error);

        Swal.fire({
          title: "Connexion refusée",
          text: error.response.data.error,
          icon: "warning",

          confirmButtonText: "Réessayer",
        });
      } finally {
        setUser({
          ...user,
          Nom: "",
          Prenom: "",
          email: "",
          password: "",
        });
        setConfirmedCode(false);
        setIsLoading(false);
      }
    } else {
      Swal.fire({
        title: "Connexion refusée",
        text: "Veuiilez verifier les mots de passe ainsi que le code qu'on vous a envoyé ",
        icon: "warning",

        confirmButtonText: "Réessayer",
      });
    }
  };

  const handleConnectionSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    user;

    axios
      .post("http://localhost:5000/api/user/checkConnection", {
        email: user.email,
        password: user.password,
      })
      .then((response) => {
        setUser({ ...response.data.user, password: "" });
        setConnectedUser(true);
        setShowConnectionForm(false);
        response.data.user;

        localStorage.setItem(
          "user",
          JSON.stringify({ ...response.data.user, password: user.password })
        );
        Swal.fire({
          title: "Connectée",
          confirmButtonText: "ok",
          timer: 2000,
        });
      })
      .catch((error) => {
        console.error(error);
        setUser({
          ...user,
          Nom: "",
          Prenom: "",
          email: "",
          password: "",
          code: 0,
        });
        Swal.fire({
          title: "Connexion refusée",
          html: error.response.data.error,
          icon: "warning",

          confirmButtonText: "Réessayer",
        });
      })
      .finally(() => setIsLoading(false));
  };
  const handleDelete = async () => {
    if (connectedUser) {
      const selectedDevices = data.filter((item) => item.selected);

      if (selectedDevices.length === 0) return;

      const confirmed = await Swal.fire({
        title: "Êtes-vous sûr?",
        text: `Vous allez supprimer ${selectedDevices.length} élément(s). Cette action est irréversible!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Oui, supprimer !",
        cancelButtonText: "Annuler",
      }).then((result) => result.isConfirmed);
      if (confirmed) {
        const deleteRequests =
          allChecked && JSON.stringify(data) === JSON.stringify(dataFiltered)
            ? [axios.delete(`http://localhost:5000/api/devices/devices/all`)]
            : [
                axios.post(
                  `http://localhost:5000/api/devices/devices/multiply`,
                  { id: selectedDevices.map((s) => s.id) }
                ),
              ];

        await Promise.all(deleteRequests)
          .then(() => {
            const updatedData = data.filter((d) => !d.selected);
            const updatedDataFiltered = dataFiltered.filter((d) => !d.selected);
            selectedDevices.map((selectedDevice) => {
              let log = `(${user.Nom}, ${user.Prenom}, ${
                user.email
              }) a supprimé (id:${selectedDevice.id}, Nom:${
                selectedDevice.name
              }, Type:${
                selectedDevice.type
              }) ce ${new Date().toLocaleDateString()})`;

              const newLog = {
                name: log,
                type: "Suppression",
                device: selectedDevice,
                user: user,
                date: new Date().toISOString(),
              };

              handlePostLog(log, "Suppression", selectedDevice);
            });

            setData(updatedData);
            setDataFiltered(updatedDataFiltered);
            generateCategorySummary(updatedData);
            Swal.fire({
              title: "Bien joué!",
              text: "Vos données ont été supprimées.",
              icon: "success",
              timer: 3000,
              confirmButtonText: "Continuer",
            });
          })
          .catch((error) => console.error("❌ Suppression échouée :", error));
      }
    } else {
      setShowConnectionForm(true);
    }
  };

  const handleChangeComponent = (deviceId, indexP, key, value) => {
    setInsertDevices((prev) => ({
      ...prev,
      devices: prev.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              component: {
                ...d.component,
                [indexP]: {
                  ...d.component[indexP],
                  [key]: value,
                },
              },
            }
          : d
      ),
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();

    const updatedData = data.filter((device) => {
      const test =
        device.name?.toLowerCase().includes(value) ||
        device.type?.toLowerCase().includes(value) ||
        device.id === parseInt(value) ||
        device.status?.toLowerCase().includes(value) ||
        device.current_value
          ?.toString()
          .concat(" " + device.devises?.toLowerCase())
          .includes(value) ||
        printDate(device.purchase_date).includes(value) ||
        printDate(device.warranty_end).includes(value);

      if (deviceFilter === "all") {
        return test;
      } else if (deviceFilter === "expiredOnly") {
        return test && calculateAmortization(device) < 25;
      }
      return test && calculateAmortization(device) >= 25;
    });
    const newCheckedState =
      updatedData.length > 0 && updatedData.every((device) => device.selected);

    setSearch(value);
    setDataFiltered(value === "" ? data : updatedData);
    generateCategorySummary(value === "" ? data : updatedData);
    setAllChecked(newCheckedState);
  };

  const toggleSelectAll = () => {
    const newCheckedState = !allChecked;
    const newCheckedList = filteredDevices.map((device) => ({
      ...device,
      selected: newCheckedState,
    }));
    console.log(newCheckedList);
    setAllChecked(newCheckedState);
    setDataFiltered(newCheckedList);

    setData((prev) => {
      return prev.map((item) => {
        const replacement = newCheckedList.find(
          (newItem) => newItem.id === item.id
        );
        return replacement ? replacement : item;
      });
    });
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
    setAllChecked(updatedDataFiltered.every((device) => device.selected));
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
    deviceSelected;
    setShowDetails(true);
  };

  // const handleTypeChange = (e) => {
  //   const typedData = e.target.value;
  //   const componentsList = devices[typedData].components;
  //   let temporaryVariable = newDevice;

  //   componentsList.forEach((component) => {
  //     temporaryVariable = {
  //       ...temporaryVariable,
  //       type: typedData,
  //       component: {
  //         ...temporaryVariable.component,
  //         [component.name]: component.options
  //           ? component.capacity
  //             ? { options: "", capacity: "" }
  //             : { options: "" }
  //           : { value: "" },
  //       },
  //     };
  //   });
  //   setNewDevice(temporaryVariable);
  // };

  const handleModify = (device) => {
    const temporaryVariable = device;
    setSelectedDevice(device);
    temporaryVariable;
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

        setExpiredDevice((prev) => [device, ...prev]);

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
        if (value.options) {
          let index = value.options.indexOf(
            device.component[value.name].options
          );
          if (value.expirationsDate) {
            if (
              new Date().toLocaleDateString().split("T")[0] >
              new Date(value.expirationsDate[index])
                .toLocaleDateString()
                .split("T")[0]
            )
              tmpForAlert.push(
                `${device.name} doit effectuer une mise a jours sur ${value.name}`
              );
          } else {
            value.options.length / 2 >= 2 && index < value.options.length / 2
              ? tmpForAlert.push(
                  `${device.name} doit effectuer une amelioration sur ${value.name}`
                )
              : "";
          }
          if (device.component[value.name].capacity < 4 && value.name === "RAM")
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
        html: ` <details>${tmpForAlert.join("</br>")}</details>`,
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
          expiredDevice.forEach((device, index) => {
            setInterval(() => handleShowDetails(device), index * 10000);
          });
        }
      });
    }
  };

  // Fonction pour calculer le pourcentage d'amortissement

  const handleLogSort = (key) => {
    let direction = "asc";

    // Si on trie déjà par cette clé, on inverse la direction
    if (sortLogConfig.key === key && sortLogConfig.direction === "asc") {
      direction = "desc";
    }

    const sortedLogs = [...logFiltered].sort((a, b) => {
      let aValue, bValue;

      if (key === "user") {
        aValue = a.user.Nom;
        bValue = b.user.Nom;
      } else if (key === "device") {
        aValue = a.device.name;
        bValue = b.device.name;
      } else if (key === "type") {
        aValue = a.device.type;
        bValue = b.device.type;
      } else {
        aValue = a[key];
        bValue = b[key];
      }

      if (typeof aValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return direction === "asc" ? aValue - bValue : bValue - aValue;
    });

    setSortLogConfig({ key: key, direction: direction });
    setLogFiltered(sortedLogs);
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

  const handleOpenPersonalForm = () => {};

  const highlightText = (text, toTest) => {
    if (!toTest) return text;
    const regex = new RegExp(`(${toTest})`, "gi");

    return text
      ?.toString()
      .split(regex)
      .map((part, index) =>
        part.toLowerCase() === toTest.toLowerCase() ? (
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
      "Fournisseur",
      "Libellé du facture",
      "composant",
    ];

    const tableData = data.map((item) => [
      item.id,
      item.name,
      item.type,
      new Date(item.purchase_date),
      item.current_value,
      new Date(item.warranty_end),
      item.providerName,
      item.facture,
      JSON.stringify(item.component),
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
      // window.location.href = "/";
    });
  };

  const showDevice = (devices) => {
    // setAllChecked()
    return devices.length === 0 ? (
      <tr>
        <td colSpan="9" className="text-center">
          Aucun matériel trouvé
        </td>
      </tr>
    ) : (
      devices.map((device) => (
        <tr
          // key={device.id}
          onClick={() => toggleItem(device.id)}
          className={
            calculateAmortization(device) < 25
              ? "table-danger"
              : device.selected
              ? "table-secondary"
              : ""
          }
        >
          <td>
            <input
              type="checkbox"
              onChange={() => toggleItem(device.id)}
              checked={device.selected}
            />
          </td>
          <td>{highlightText(device.id, search)}</td>
          <td>{highlightText(device.name, search)}</td>
          <td>{highlightText(device.type || "Pas de type", search)}</td>
          <td>
            {highlightText(
              printDate(device.purchase_date).slice(0, 11),
              search
            )}
          </td>
          <td>
            {highlightText(
              device.current_value
                ? `${device.current_value} ${device.devises}`
                : "N/A",
              search
            )}
          </td>
          <td>
            {highlightText(printDate(device.warranty_end).slice(0, 11), search)}
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
                          width: `${calculateAmortization(device)}%`,
                        }
                      : {}
                  }
                ></div>
              </div>
              <span className="text-center">
                {highlightText(device.status, search)}
              </span>
            </div>
          </td>
          <td>
            <div className="d-flex justify-content-between">
              <button
                id="info-button"
                className="btn btn-info"
                onClick={(event) => {
                  event.stopPropagation();
                  handleShowDetails(device);
                }}
              >
                <FaInfo />
              </button>
              <button
                id="modify-button"
                className="btn btn-warning"
                onClick={(event) => {
                  event.stopPropagation();
                  handleModify(device);
                }}
              >
                <FaPen />
              </button>
            </div>
          </td>
        </tr>
      ))
    );
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
          localStorage.removeItem("user");
          setNotifications([]);
          setShowConnectionForm(true);
          setShowForm(false);
          setShowNotifications(false);
          setShowModifyInput(false);
        }
      });
    }
  };

  const handleConfirmEmail = async () => {
    if (user.email) {
      try {
        setIsLoading(true);

        const response = await axios.post(
          "http://localhost:5000/api/user/send-code",
          { email: user.email }
        );
        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: `Code envoyé à l'adresse e-mail ${user.email}`,
          });
          setIsCodeSent(true);
        } else {
          Swal.fire({
            icon: "warning",
            title: `Code non envoyé: ${response.data.error}`,
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Erreur d'envoi",
          text: error.data.error || "Une erreur est survenue.",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: `Code non envoyé: Veuillez ajouter une e-mail`,
      });
    }
  };

  const showLog = (logFiltered) => {
    // (logFiltered)
    return logFiltered.length > 0 ? (
      logFiltered.map((log) => (
        <tr
          onClick={() => {
            Swal.fire({
              title: log.type,
              html: log.name,
            });
          }}
        >
          <td>
            {highlightText(
              log.user.Nom + " " + log.user.Prenom + " " + log.user.email,
              searchLog
            )}
          </td>
          <td>{highlightText(log.type, searchLog)}</td>
          <td>{highlightText(log.device.name, searchLog)}</td>
          <td>{highlightText(log.device.type, searchLog)}</td>
          <td>{highlightText(printDate(log.date), searchLog)}</td>
          <td className="btn btn-info d-flex">
            <FaInfo />
          </td>
        </tr>
      ))
    ) : (
      <td colSpan={6} className="text-center">
        Aucun log trouvé pour {`  <<${searchLog}>>  `}
      </td>
    );
  };

  const handleConfirmCode = () => {
    setIsLoading(true);
    if (user.code) {
      try {
        axios
          .post("http://localhost:5000/api/user/verify-code", {
            email: user.email,
            code: user.code,
          })
          .then((response) => {
            response.data.success
              ? setConfirmedCode(true)
              : Swal.fire({
                  title: response.data.message,
                  confirmButtonText: "ok",
                  timer: 2000,
                }).then(() => {
                  setUser({ ...user, code: "" });
                });
          });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenLog = () => {};

  const handlePostLog = async (log, type, device) => {
    const response = await axios.post(
      "http://localhost:5000/api/logs/addlogs",
      {
        name: log,
        type: type,
        user: user,
        device: device,
      }
    );
    setLogs((prev) => [response.data.logs, ...prev]);
    setLogFiltered((prev) => [response.data.logs, ...prev]);
  };

  const handleDeleteLog = (value) => {
    axios
      .delete(`http://localhost:5000/api/logs/deletelogs/${value.id}`)
      .then(() => {
        setLogs(logs.filter((log) => log.id != value.id));
      });
  };

  const handleShowNotifications = async () => {
    await axios
      .get("http://localhost:5000/api/notifications/showNotifications")
      .then((response) => {
        if (!response.data.error) {
          setNotifications(
            response.data.result.length > 0 ? response.data.result : []
          );
          response.data.result;
        }
      });
  };

  const handleSearchLogChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchLog(value);

    const updatedValue = logs.filter(
      (log) =>
        log.user.Prenom.toLowerCase().includes(value) ||
        log.user.email.toLowerCase().includes(value) ||
        log.device?.name?.toLowerCase().includes(value) ||
        log.device?.type?.toLowerCase().includes(value) ||
        printDate(log.date)?.toString().toLowerCase().includes(value) ||
        log.type.toLowerCase().includes(value) ||
        (log.user.Nom + " " + log.user.Prenom + " " + log.user.email)
          .toLowerCase()
          .includes(value)
    );

    setLogFiltered(value === "" ? logs : updatedValue);
  };

  const isSameObject = (a, b) => {
    let changes = "";

    for (const key in a) {
      if (!(key in b)) changes += `${a[key]} devient indéfinie`;
      else if (typeof a[key] === "object" && typeof b[key] === "object") {
        const nestedChanges = isSameObject(a[key], b[key]);
        if (nestedChanges) {
          changes += `${key}: ${nestedChanges}`;
        }
      } else if (a[key] != b[key]) {
        changes += `${key}: ${a[key]} devient ${b[key]}`;
      }
    }

    for (const key in b) {
      if (!(key in a)) {
        changes += `undefined devient ${b[key]}`;
      }
    }

    return changes;
  };

  function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
  }

  const handlePersonalFormSubmit = async (e) => {
    e.preventDefault();
    const response = await axios.post(
      "http://localhost:5000/api/personnals/addPersonnal",
      personnals.newPersonal
    );
    if (!response.data.error) {
      setPersonals((prev) => ({
        ...prev,
        allPersonals: [prev.newPersonal, ...prev.allPersonals],
        newPersonal: {
          Nom: "",
          Prenom: "",
          email: "",
          password: "",
          isadmin: 0,
        },
      }));
      Swal.fire({
        title: "Bien joué!",
        text: "Vos données ont été enregistrées.",
        icon: "success",
        timer: 1500,
        confirmButtonText: "Continuer",
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
  //   (extractedValues);

  //   return extractedValues;
  // };

  return (
    <div className="body m-2">
      <nav className="navbar navbar-expand-md navbar-light bg-light shadow my-3 mx-3 rounded main-header">
        <div className="container d-flex justify-content-between align-items-center">
          {/* Logo */}
          <a href="/" className="text-decoration-none">
            <div className="d-flex flex-column align-items-center logo">
              <img src="/logo_seimad.jpg" width={100} height={100} alt="Logo" />
              <h4 className="text-primary font-weight-bold mt-2 text-center">
                Société d'équipement immobilier de Madagascar
              </h4>
            </div>
          </a>
          <div className="d-flex flex-column align-items-center">
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#userNav"
            >
              <FaUser />
            </button>

            {/* Menu utilisateur */}
            <div
              className="collapse navbar-collapse"
              id="userNav"
              style={{ cursor: "pointer" }}
              onClick={handleSignout}
            >
              <FaUser className="text-primary me-2" />
              {connectedUser ? (
                <div className="btn btn-success text-white mt-3 rounded-pill">
                  <h5 className="mb-0">
                    Utilisateur:{" "}
                    {user.isadmin === 1 && (
                      <span className="badge bg-dark">admin</span>
                    )}
                  </h5>
                  <h6 className="mb-0">
                    {user.Nom} {user.Prenom}
                  </h6>
                  <p className="mb-0">Email: {user.email}</p>
                </div>
              ) : (
                <div className="btn btn-secondary text-white mt-3">
                  Utilisateur non connecté
                </div>
              )}
            </div>
          </div>
          {/* Menu principal */}
          <div className="" id="">
            <ul className="navbar-nav ms-4 d-flex flex-row gap-4 align-items-center">
              {/* Bouton logs */}
              <li
                className="nav-item d-flex align-items-center"
                onClick={() => setIsLogOpen(true)}
              >
                <div className="btn btn-dark p-3">
                  <FaPaperclip />
                  <span className="badge bg-success navbar-badge">
                    logs:{logs.length}
                  </span>
                </div>
              </li>

              {/* Bouton notifications (admin seulement) */}
              {connectedUser && user.isadmin === 1 && (
                <>
                  <li className="nav-item d-flex align-items-center">
                    <button
                      className="btn p-3"
                      style={{ backgroundColor: "lightblue" }}
                      onClick={() => {
                        setShowNotifications(true);
                        notifications;
                      }}
                    >
                      <FaBell />
                    </button>
                    <span className="badge rounded-pill bg-success ms-2">
                      {notifications.length}
                    </span>
                  </li>

                  <li
                    className="nav-item d-flex align-items-center"
                    onClick={() => setShowPersonalForm(true)}
                  >
                    <div className="btn btn-success p-3">
                      + Ajouter un personnels
                    </div>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <style jsx={true}>{`
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
      <div className="d-flex justify-content-around">
        <h1 className="text-center title">
          Tableau récapitulatif des Matériels Informatiques
        </h1>
      </div>
      <div className="row mt-5">
        <div className="col-lg-9 col-md-12">
          <div className="d-flex justify-content-between">
            <h4>Nombre d'élément: {filteredDevices.length}</h4>
            <div>
              <label htmlFor="selectFilter">Filtrer par: </label>
              <select
                name="selectFilter"
                id="selectFilter"
                onChange={(e) => setDeviceFiltered(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="expiredOnly">Inactive</option>
                <option value="inExpiredOnly">Active</option>
              </select>
            </div>
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
                  // style={{ width: "300px" }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              overflow: "scroll",
              maxHeight: "700px",
              background: "lightcyan",
            }}
            className="table-fluid p-3"
          >
            <table
              className="table table-hover table-bordered"
              id="deviceTable"
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
              <tbody>{showDevice(filteredDevices)}</tbody>
            </table>
          </div>

          <div
            className="d-flex flex-direction-column justify-content-end"
            style={{}}
          >
            {data.some((device) => device.selected) && (
              <button className="btn btn-danger m-3" onClick={handleDelete}>
                Supprimer les ({data.filter((device) => device.selected).length}
                ) éléments sélectionnés
              </button>
            )}
            <button
              className="btn btn-info m-3"
              id="exportButton"
              onClick={handleExportExcel}
            >
              Exporter
            </button>
            <button
              className="btn btn-success m-3"
              id="addButton"
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

            <style jsx={true}>{`
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

      {showNotifications && (
        <div
          className="position-fixed top-0 end-0 bg-white shadow p-3 rounded"
          style={{
            width: "350px",
            maxHeight: "90vh",
            overflowY: "scroll",
            zIndex: 1050,
            marginTop: "70px", // pour ne pas couvrir le header sticky
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 text-primary">
              <FaBell />
              Notifications
            </h5>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => setShowNotifications(false)}
            >
              <FaTimes />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="text-muted text-center">Aucune notification</div>
          ) : (
            <ul className="list-group">
              {notifications.map((notification, idx) => (
                <li
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">{notification.name}</div>
                    <small className="text-muted">{notification.type}</small>
                  </div>
                  <div>
                    <span
                      className="btn btn-success"
                      onClick={() => {
                        handlePostLog(
                          `Acceptation de demande d\' ${notification.type} de (${notification.user.Nom} ${notification.user.Prenom} ${notification.user.email})`,
                          "Acceptation de demande",
                          []
                        );
                        setLogs((prev) => [
                          {
                            name: `Acceptation de demande d\' ${notification.type} de (${notification.user.Nom} ${notification.user.Prenom} ${notification.user.email})`,
                            type: `Acceptaion de demande`,
                            date: new Date().toISOString(),
                            device: [],
                            user: user,
                          },
                          ...prev,
                        ]);
                        setNotifications((prev) =>
                          prev.filter(
                            (notif) => notif.name != notification.name
                          )
                        );
                        axios.put(
                          `http://localhost:5000/api/notifications/notifications/${notification.user.id}`,
                          { type: notification.type, permission: "Allowed" }
                        );
                      }}
                    >
                      <FaCheck />
                    </span>
                    <span
                      className="btn btn-danger"
                      onClick={() => {
                        handlePostLog(
                          `Refus de demande d\' ${notification.type} de (${notification.user.Nom} ${notification.user.Prenom} ${notification.user.email})`,
                          "Refus de demande",
                          []
                        );

                        setNotifications((prev) =>
                          prev.filter(
                            (notif) => notif.user.id != notification.user.id
                          )
                        );

                        axios.put(
                          `http://localhost:5000/api/notifications/notifications/${notification.user.id}`,
                          { type: notification.type, permission: "Denied" }
                        );
                      }}
                    >
                      <FaTimes />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal isOpen={isLogOpen} onRequestClose={() => setIsLogOpen(false)}>
        <div className="d-flex justify-content-end">
          <div className="btn btn-danger" onClick={() => setIsLogOpen(false)}>
            X
          </div>
        </div>
        <div className="container">
          <>
            <h1 className="text-center">Liste des logs (changement)</h1>
            <div className="d-flex justify-content-between">
              <h4 className="h4">
                Résultat:{" "}
                {logFilterOption != "all"
                  ? logFilterOption === "addOnly"
                    ? logFiltered.filter((l) => l.type === "Ajout").length
                    : logFilterOption === "deleteOnly"
                    ? logFiltered.filter((l) => l.type === "Suppression").length
                    : logFiltered.filter((l) => l.type === "Modification")
                        .length
                  : logFiltered.length}{" "}
                élément(s)
              </h4>
              <div>
                <label htmlFor="selectLogFilter">Filtrer par: </label>
                <select
                  name="selectLogFilter"
                  id="selectLogFilter"
                  onChange={(e) => setLogFilterOption(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="addOnly">Ajout</option>
                  <option value="deleteOnly">Suppression</option>
                  <option value="updateInly">Modification</option>
                </select>
              </div>
              <div className="d-flex justify-content-end mb-3">
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
                    value={searchLog}
                    onChange={handleSearchLogChange}
                    placeholder=" Rechercher un log ici (Date,materiel,utilisateur)..."
                    className="form-control text-center"
                    // style={{ width: "400px" }}
                  />
                </div>
              </div>
            </div>
            <div style={{ overflow: "scroll" }}>
              <table className="table table-bordered table-striped ">
                <thead>
                  <tr>
                    <th onClick={() => handleLogSort("user")}>
                      Utilisateur <FaSort />
                    </th>
                    <th onClick={() => handleLogSort("type")}>
                      Action <FaSort />
                    </th>
                    <th onClick={() => handleLogSort("device")}>
                      Nom du Materiel <FaSort />
                    </th>
                    <th onClick={() => handleLogSort("type")}>
                      Type du materiel <FaSort />
                    </th>
                    <th onClick={() => handleLogSort("date")}>
                      Date de l'action <FaSort />
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {logFilterOption != "all"
                    ? logFilterOption === "addOnly"
                      ? showLog(logFiltered.filter((l) => l.type === "Ajout"))
                      : logFilterOption === "deleteOnly"
                      ? showLog(
                          logFiltered.filter((l) => l.type === "Suppression")
                        )
                      : showLog(
                          logFiltered.filter((l) => l.type === "Modification")
                        )
                    : showLog(logFiltered)}
                </tbody>
              </table>
            </div>
          </>
        </div>
      </Modal>

      <Modal
        isOpen={showForm}
        onRequestClose={() => setShowForm(false)}
        className=""
      >
        <div
          style={{ position: "sticky" }}
          className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3"
        >
          <h1 className="modal-title mb-0 fs-4">
            Ajout des nouveaux matériels
          </h1>

          <button
            type="button"
            className="btn-close"
            aria-label="Fermer"
            onClick={() => setShowForm(false)}
          ></button>
        </div>

        <form
          onSubmit={
            /*handleFormSubmit*/ (e) => {
              e.preventDefault();
              console.log(insertDevices);
            }
          }
          className="mb-3"
        >
          <div className="form-group d-flex justify-content-center align-items-center my-4">
            <label htmlFor="userCode" className="form-label h3 me-3">
              Matricule utilisateur (facultatif) :
            </label>
            <input
              id="userCode"
              type="number"
              className="form-control w-auto"
              style={{ maxWidth: "200px" }}
              placeholder="Enter ici la Matricule"
              value={insertDevices.personnals.newPersonal.userCode || ""}
              onChange={(e) =>
                setInsertDevices((prev) => ({
                  ...prev,
                  personnals: {
                    ...prev.personnals,
                    newPersonal: {
                      ...prev.personnals.newPersonal,
                      userCode: e.target.value,
                    },
                  },
                }))
              }
            />
          </div>

          <div>
            <div className="fw-bold ">
              <h1>
                Veuillez compléter les informations concernant le materiel:
              </h1>
            </div>

            <div>
              {insertDevices.devices.map((device) => (
                <div className="card" key={device.id}>
                  <div className="form-group m-5">
                    <div className="d-flex justify-content-between">
                      <label htmlFor="type">Type</label>

                      <div>
                        {insertDevices.devices.length > 1 && (
                          <div
                            className="btn btn-danger m-2"
                            onClick={() =>
                              setInsertDevices((prev) => ({
                                ...prev,
                                devices: prev.devices.filter(
                                  (d) => d.id != device.id
                                ),
                              }))
                            }
                          >
                            <FaTrash />
                          </div>
                        )}
                      </div>
                    </div>
                    <select
                      className="form-control"
                      value={device.type}
                      onChange={(e) => {
                        const selectedType = e.target.value;
                        let componentsList;

                        // Construire dynamiquement l'objet `component`
                        const componentData = {};
                        if (!(selectedType === "Composant")) {
                          componentsList = devices[selectedType].components;

                          componentsList.forEach((component) => {
                            if (component.options) {
                              componentData[component.name] = component.capacity
                                ? { options: "", capacity: "" }
                                : { options: "" };
                            } else {
                              componentData[component.name] = {
                                value: "",
                              };
                            }
                          });
                        } else {
                          // componentData= {
                          //   value:"",options:"",otherOptions:''
                          // }
                        }

                        // Créer un nouvel objet device à insérer
                        const updatedDevice = {
                          ...newDevice,
                          type: selectedType,
                          component: componentData,
                        };

                        console.log(updatedDevice);

                        // Mettre à jour l'état
                        setInsertDevices((prev) => ({
                          ...prev,
                          devices: prev.devices.map((d) =>
                            d.id === device.id
                              ? { ...updatedDevice, id: d.id }
                              : d
                          ),
                        }));
                      }}
                      required
                      id="type"
                    >
                      <option value="">
                        Sélectionner un appareil informatique
                      </option>
                      {Object.keys(devices).map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="Composant">Juste une composant</option>
                    </select>

                    {device.type && (
                      <div className="mt-3">
                        <div>
                          <h4>Composants :</h4>
                        </div>
                        {device.type === "Composant" ? (
                          <div>
                            <select
                              required
                              value={device.name}
                              onChange={(e) =>
                                setInsertDevices((prev) => ({
                                  ...prev,
                                  devices: prev.devices.map((d) =>
                                    d.id === device.id
                                      ? { ...d, name: e.target.value }
                                      : d
                                  ),
                                }))
                              }
                            >
                              <option value="">-- Sélectionner --</option>
                              {Object.keys(devices).map((item) =>
                                Object.entries(devices[item].components).map(
                                  ([index, composant]) =>
                                    !composant.isNotComponent && (
                                      <option
                                        key={`${item}-${index}`}
                                        value={`${composant.name}-${item}`}
                                      >
                                        {composant.name} {item}
                                      </option>
                                    )
                                )
                              )}
                            </select>
                            {device.name &&
                              devices[device.name.split("-")[1]].components.map(
                                (composant, index) =>
                                  device.name.split("-")[0] ===
                                    composant.name && (
                                    <div key={index} className="mb-2 card p-2">
                                      <label htmlFor="component" className="">
                                        {composant.name} :
                                      </label>

                                      {composant.options ? (
                                        <div className="mb-3">
                                          {!composant.isNotComponent && (
                                            <div className="d-flex justify-content-between">
                                              <div>
                                                <label htmlFor="serialNumber">
                                                  Numero de Série:
                                                </label>
                                                <input
                                                  type="text"
                                                  name=""
                                                  value={
                                                    device.component[
                                                      composant.name
                                                    ]?.serialNumber
                                                  }
                                                  id="serialNumber"
                                                  required
                                                  onChange={(e) => {
                                                    setInsertDevices(
                                                      (prev) => ({
                                                        ...prev,
                                                        devices:
                                                          prev.devices.map(
                                                            (d) =>
                                                              d.id === device.id
                                                                ? {
                                                                    ...d,
                                                                    component: {
                                                                      ...d.component,
                                                                      [composant.name]:
                                                                        {
                                                                          ...d
                                                                            .component[
                                                                            composant
                                                                              .name
                                                                          ],
                                                                          serialNumber:
                                                                            e
                                                                              .target
                                                                              .value,
                                                                        },
                                                                    },
                                                                  }
                                                                : d
                                                          ),
                                                      })
                                                    );
                                                  }}
                                                />
                                              </div>

                                              <div>
                                                <label htmlFor="marque">
                                                  Marque:
                                                </label>
                                                <input
                                                  type="text"
                                                  name=""
                                                  value={
                                                    device.component[
                                                      composant.name
                                                    ]?.marque
                                                  }
                                                  id="marque"
                                                  onChange={(e) => {
                                                    setInsertDevices(
                                                      (prev) => ({
                                                        ...prev,
                                                        devices:
                                                          prev.devices.map(
                                                            (d) =>
                                                              d.id === device.id
                                                                ? {
                                                                    ...d,
                                                                    component: {
                                                                      ...d.component,
                                                                      [composant.name]:
                                                                        {
                                                                          ...d
                                                                            .component[
                                                                            composant
                                                                              .name
                                                                          ],

                                                                          marque:
                                                                            e
                                                                              .target
                                                                              .value,
                                                                        },
                                                                    },
                                                                  }
                                                                : d
                                                          ),
                                                      })
                                                    );
                                                  }}
                                                />
                                              </div>

                                              <div>
                                                <label htmlFor="model">
                                                  Modèle:
                                                </label>
                                                <input
                                                  type="text"
                                                  name=""
                                                  id="model"
                                                  value={
                                                    device.component[
                                                      composant.name
                                                    ]?.model
                                                  }
                                                  onChange={(e) => {
                                                    setInsertDevices(
                                                      (prev) => ({
                                                        ...prev,
                                                        devices:
                                                          prev.devices.map(
                                                            (d) =>
                                                              d.id === device.id
                                                                ? {
                                                                    ...d,
                                                                    component: {
                                                                      ...d.component,
                                                                      [composant.name]:
                                                                        {
                                                                          ...d
                                                                            .component[
                                                                            composant
                                                                              .name
                                                                          ],

                                                                          model:
                                                                            e
                                                                              .target
                                                                              .value,
                                                                        },
                                                                    },
                                                                  }
                                                                : d
                                                          ),
                                                      })
                                                    );
                                                  }}
                                                />
                                              </div>
                                              <div>
                                                <label htmlFor="purchase_date">
                                                  Date d'achat:
                                                </label>
                                                <input
                                                  type="date"
                                                  name=""
                                                  id="purchase_date"
                                                  required
                                                  value={
                                                    device.component[
                                                      composant.name
                                                    ]?.purchase_date ||
                                                    new Date()
                                                      .toISOString()
                                                      .split("T")[0]
                                                  }
                                                  onChange={(e) => {
                                                    setInsertDevices(
                                                      (prev) => ({
                                                        ...prev,
                                                        devices:
                                                          prev.devices.map(
                                                            (d) =>
                                                              d.id === device.id
                                                                ? {
                                                                    ...d,
                                                                    component: {
                                                                      ...d.component,
                                                                      [composant.name]:
                                                                        {
                                                                          ...d
                                                                            .component[
                                                                            composant
                                                                              .name
                                                                          ],

                                                                          purchase_date:
                                                                            e
                                                                              .target
                                                                              .value,
                                                                        },
                                                                    },
                                                                  }
                                                                : d
                                                          ),
                                                      })
                                                    );
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          )}

                                          <div className="d-flex justify-content-between m-2">
                                            {composant.capacity && (
                                              <input
                                                id="component"
                                                required
                                                type={composant.type || "text"}
                                                onBlur={() => {
                                                  if (
                                                    composant.name === "RAM" ||
                                                    composant.name ===
                                                      "Stockage"
                                                  ) {
                                                    if (
                                                      !isPowerOfTwo(
                                                        device.component[
                                                          composant.name
                                                        ].capacity
                                                      )
                                                    ) {
                                                      setInsertDevices(
                                                        (prev) => ({
                                                          ...prev,
                                                          devices:
                                                            prev.devices.map(
                                                              (d) =>
                                                                d.id ===
                                                                device.id
                                                                  ? {
                                                                      ...d,
                                                                      component:
                                                                        {
                                                                          ...d.component,
                                                                          [composant.name]:
                                                                            {
                                                                              ...d
                                                                                .component[
                                                                                composant
                                                                                  .name
                                                                              ],

                                                                              capacity:
                                                                                null,
                                                                            },
                                                                        },
                                                                    }
                                                                  : d
                                                            ),
                                                        })
                                                      );

                                                      device.component[
                                                        composant.name
                                                      ].capacity &&
                                                        Swal.fire({
                                                          title: `Valeur invalide sur le ${composant.name}`,
                                                          html: `<h4>${composant.name} doit etre toujours puissance de 2 </br>(ex:2,4,8,...) </h4>`,
                                                          icon: "warning",
                                                        });
                                                    }
                                                  }
                                                }}
                                                value={Math.abs(
                                                  parseInt(
                                                    device.component[
                                                      composant.name
                                                    ]?.capacity
                                                  )
                                                )}
                                                placeholder={`Entrer ${composant.name}`}
                                                className="form-control"
                                                onChange={(e) => {
                                                  setInsertDevices((prev) => ({
                                                    ...prev,
                                                    devices: prev.devices.map(
                                                      (d) =>
                                                        d.id === device.id
                                                          ? {
                                                              ...d,
                                                              component: {
                                                                ...d.component,
                                                                [composant.name]:
                                                                  {
                                                                    ...d
                                                                      .component[
                                                                      composant
                                                                        .name
                                                                    ],

                                                                    capacity:
                                                                      e.target
                                                                        .value,
                                                                  },
                                                              },
                                                            }
                                                          : d
                                                    ),
                                                  }));
                                                }}
                                              />
                                            )}
                                            <select
                                              required
                                              value={
                                                device.component[composant.name]
                                                  ?.options || ""
                                              }
                                              className="form-control "
                                              onChange={(e) => {
                                                setInsertDevices((prev) => ({
                                                  ...prev,
                                                  devices: prev.devices.map(
                                                    (d) =>
                                                      d.id === device.id
                                                        ? {
                                                            ...d,
                                                            component: {
                                                              ...d.component,
                                                              [composant.name]:
                                                                {
                                                                  ...d
                                                                    .component[
                                                                    composant
                                                                      .name
                                                                  ],

                                                                  options:
                                                                    e.target
                                                                      .value,
                                                                },
                                                            },
                                                          }
                                                        : d
                                                  ),
                                                }));
                                              }}
                                            >
                                              <option value="">
                                                -- Sélectionner --
                                              </option>
                                              {composant.options.map((item) => (
                                                <option key={item} value={item}>
                                                  {item}
                                                </option>
                                              ))}
                                            </select>
                                            {composant.otherOptions && (
                                              <select
                                                required
                                                value={
                                                  device.component[
                                                    composant.name
                                                  ]?.otherOptions || ""
                                                }
                                                onChange={(e) => {
                                                  setInsertDevices((prev) => ({
                                                    ...prev,
                                                    devices: prev.devices.map(
                                                      (d) =>
                                                        d.id === device.id
                                                          ? {
                                                              ...d,
                                                              component: {
                                                                ...d.component,
                                                                [composant.name]:
                                                                  {
                                                                    ...d
                                                                      .component[
                                                                      composant
                                                                        .name
                                                                    ],

                                                                    otherOptions:
                                                                      e.target
                                                                        .value,
                                                                  },
                                                              },
                                                            }
                                                          : d
                                                    ),
                                                  }));
                                                }}
                                              >
                                                <option value="">
                                                  -- Sélectionner --
                                                </option>
                                                {composant.otherOptions.map(
                                                  (item) => (
                                                    <option
                                                      key={item}
                                                      value={item}
                                                    >
                                                      {item}
                                                    </option>
                                                  )
                                                )}
                                              </select>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <input
                                          type={composant.type || "text"}
                                          className="form-control"
                                          placeholder={`Entrez ${composant.name}`}
                                          id="component"
                                          value={
                                            device.component[composant.name]
                                              ?.value || ""
                                          }
                                          onChange={(e) => {
                                            setInsertDevices((prev) => ({
                                              ...prev,
                                              devices: prev.devices.map((d) =>
                                                d.id === device.id
                                                  ? {
                                                      ...d,
                                                      component: {
                                                        ...d.component,
                                                        [composant.name]: {
                                                          ...d.component[
                                                            composant.name
                                                          ],
                                                          value: e.target.value,
                                                        },
                                                      },
                                                    }
                                                  : d
                                              ),
                                            }));
                                          }}
                                          required
                                        />
                                      )}
                                    </div>
                                  )
                              )}
                          </div>
                        ) : (
                          <div>
                            <div>
                              {Object.entries(device.component).map(
                                ([indexP, c]) => (
                                  <div
                                    key={indexP}
                                    className="card p-4 mb-4 shadow-sm"
                                  >
                                    {/* Header avec le nom du composant et le bouton X */}
                                    <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                      <h5 className="mb-0 text-primary">
                                        {indexP}
                                      </h5>
                                      <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => {
                                          setInsertDevices((prev) => ({
                                            ...prev,
                                            devices: prev.devices.map((d) =>
                                              d.id === device.id
                                                ? {
                                                    ...d,
                                                    component:
                                                      Object.fromEntries(
                                                        Object.entries(
                                                          d.component
                                                        ).filter(
                                                          ([key]) =>
                                                            key !== indexP
                                                        )
                                                      ),
                                                  }
                                                : d
                                            ),
                                          }));
                                        }}
                                      >
                                        Supprimer
                                      </button>
                                    </div>

                                    {/* Champs du composant */}
                                    {isComponentOptions(device.type, indexP) ? (
                                      <>
                                        {isComponent(device.type, indexP) && (
                                          <div className="row g-3 mb-3">
                                            <div className="col-md-3">
                                              <label className="form-label">
                                                Numéro de Série
                                              </label>
                                              <input
                                                type="text"
                                                className="form-control"
                                                value={c.serialNumber || ""}
                                                onChange={(e) =>
                                                  handleChangeComponent(
                                                    device.id,
                                                    indexP,
                                                    "serialNumber",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="col-md-3">
                                              <label className="form-label">
                                                Marque
                                              </label>
                                              <input
                                                type="text"
                                                className="form-control"
                                                value={c.marque || ""}
                                                onChange={(e) =>
                                                  handleChangeComponent(
                                                    device.id,
                                                    indexP,
                                                    "marque",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="col-md-3">
                                              <label className="form-label">
                                                Modèle
                                              </label>
                                              <input
                                                type="text"
                                                className="form-control"
                                                value={c.model || ""}
                                                onChange={(e) =>
                                                  handleChangeComponent(
                                                    device.id,
                                                    indexP,
                                                    "model",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="col-md-3">
                                              <label className="form-label">
                                                Date d'achat
                                              </label>
                                              <input
                                                type="date"
                                                className="form-control"
                                                value={
                                                  c.purchase_date ||
                                                  new Date()
                                                    .toISOString()
                                                    .split("T")[0]
                                                }
                                                onChange={(e) =>
                                                  handleChangeComponent(
                                                    device.id,
                                                    indexP,
                                                    "purchase_date",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>
                                        )}

                                        <div className="row g-3">
                                          {isComponentCapacity(
                                            device.type,
                                            indexP
                                          ) && (
                                            <div className="col-md-4">
                                              <label className="form-label">
                                                Capacité
                                              </label>
                                              <input
                                                type={
                                                  showType(
                                                    device.type,
                                                    indexP
                                                  ) || "text"
                                                }
                                                className="form-control"
                                                placeholder={`Entrer ${indexP}`}
                                                value={c.capacity || ""}
                                                onChange={(e) =>
                                                  handleChangeComponent(
                                                    device.id,
                                                    indexP,
                                                    "capacity",
                                                    e.target.value
                                                  )
                                                }
                                                onBlur={() => {
                                                  if (
                                                    (indexP === "RAM" ||
                                                      indexP === "Stockage") &&
                                                    !isPowerOfTwo(
                                                      parseInt(c.capacity)
                                                    )
                                                  ) {
                                                    Swal.fire({
                                                      title: `Valeur invalide pour ${indexP}`,
                                                      html: `<h4>${indexP} doit être une puissance de 2 (ex: 2, 4, 8, ...)</h4>`,
                                                      icon: "warning",
                                                    });

                                                    handleChangeComponent(
                                                      device.id,
                                                      indexP,
                                                      "capacity",
                                                      null
                                                    );
                                                  }
                                                }}
                                              />
                                            </div>
                                          )}

                                          <div className="col-md-4">
                                            <label className="form-label">
                                              Options
                                            </label>
                                            <select
                                              className="form-select"
                                              value={c.options || ""}
                                              onChange={(e) =>
                                                handleChangeComponent(
                                                  device.id,
                                                  indexP,
                                                  "options",
                                                  e.target.value
                                                )
                                              }
                                            >
                                              <option value="">
                                                -- Sélectionner --
                                              </option>
                                              {showOptions(
                                                device.type,
                                                indexP
                                              ).map((opt) => (
                                                <option key={opt} value={opt}>
                                                  {opt}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          {isComponentOtherOptions(
                                            device.type,
                                            indexP
                                          ) && (
                                            <div className="col-md-4">
                                              <label className="form-label">
                                                Autres options
                                              </label>
                                              <select
                                                className="form-select"
                                                value={c.otherOptions || ""}
                                                onChange={(e) =>
                                                  handleChangeComponent(
                                                    device.id,
                                                    indexP,
                                                    "otherOptions",
                                                    e.target.value
                                                  )
                                                }
                                              >
                                                <option value="">
                                                  -- Sélectionner --
                                                </option>
                                                {showOtherOptions(
                                                  device.type,
                                                  indexP
                                                ).map((opt) => (
                                                  <option key={opt} value={opt}>
                                                    {opt}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="mt-3">
                                        <input
                                          type={
                                            showType(device.type, indexP) ||
                                            "text"
                                          }
                                          className="form-control"
                                          placeholder={`Entrer ${indexP}`}
                                          value={c.value || ""}
                                          onChange={(e) =>
                                            handleChangeComponent(
                                              device.id,
                                              indexP,
                                              "value",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                            <div className="d-flex justify-content-center">
                              <h5>Autre?</h5>
                              <div className="form-group">
                                <select
                                  name=""
                                  id=""
                                  className="form-select"
                                  onChange={(e) => {
                                    setInsertDevices((prev) => ({
                                      ...prev,
                                      devices: prev.devices.map((d) =>
                                        d.id === device.id
                                          ? {
                                              ...d,
                                              extraComponent: [
                                                ...d.extraComponent,
                                                e.target.value,
                                              ],
                                            }
                                          : d
                                      ),
                                    }));
                                  }}
                                >
                                  <option value="">Si autre attribut</option>
                                  {showProperty(device.type).map(
                                    (props, index) => (
                                      <option key={index}>{props.name}</option>
                                    )
                                  )}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                        {device.extraComponent.length > 0 &&
                          device.extraComponent.map((indexP, c) => (
                            <div
                              key={indexP}
                              className="card p-4 mb-4 shadow-sm"
                            >
                              {/* Header avec le nom du composant et le bouton X */}
                              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                <h5 className="mb-0 text-primary">{indexP}</h5>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => {
                                    setInsertDevices((prev) => ({
                                      ...prev,
                                      devices: prev.devices.map((d) =>
                                        d.id === device.id
                                          ? {
                                              ...d,
                                              extraComponent:
                                                d.extraComponent.filter(
                                                  (_, index) => index != c
                                                ),
                                            }
                                          : d
                                      ),
                                    }));
                                  }}
                                >
                                  Supprimer
                                </button>
                              </div>

                              {/* Champs du composant */}
                              {isComponentOptions(device.type, indexP) ? (
                                <>
                                  {isComponent(device.type, indexP) && (
                                    <div className="row g-3 mb-3">
                                      <div className="col-md-3">
                                        <label className="form-label">
                                          Numéro de Série
                                        </label>
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={c.serialNumber || ""}
                                          onChange={(e) =>
                                            handleChangeComponent(
                                              device.id,
                                              indexP,
                                              "serialNumber",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="col-md-3">
                                        <label className="form-label">
                                          Marque
                                        </label>
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={c.marque || ""}
                                          onChange={(e) =>
                                            handleChangeComponent(
                                              device.id,
                                              indexP,
                                              "marque",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="col-md-3">
                                        <label className="form-label">
                                          Modèle
                                        </label>
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={c.model || ""}
                                          onChange={(e) =>
                                            handleChangeComponent(
                                              device.id,
                                              indexP,
                                              "model",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="col-md-3">
                                        <label className="form-label">
                                          Date d'achat
                                        </label>
                                        <input
                                          type="date"
                                          className="form-control"
                                          value={
                                            c.purchase_date ||
                                            new Date()
                                              .toISOString()
                                              .split("T")[0]
                                          }
                                          onChange={(e) =>
                                            handleChangeComponent(
                                              device.id,
                                              indexP,
                                              "purchase_date",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div className="row g-3">
                                    {isComponentCapacity(
                                      device.type,
                                      indexP
                                    ) && (
                                      <div className="col-md-4">
                                        <label className="form-label">
                                          Capacité
                                        </label>
                                        <input
                                          type={
                                            showType(device.type, indexP) ||
                                            "text"
                                          }
                                          className="form-control"
                                          placeholder={`Entrer ${indexP}`}
                                          value={c.capacity || ""}
                                          onChange={(e) =>
                                            handleChangeComponent(
                                              device.id,
                                              indexP,
                                              "capacity",
                                              e.target.value
                                            )
                                          }
                                          onBlur={() => {
                                            if (
                                              (indexP === "RAM" ||
                                                indexP === "Stockage") &&
                                              !isPowerOfTwo(
                                                parseInt(c.capacity)
                                              )
                                            ) {
                                              Swal.fire({
                                                title: `Valeur invalide pour ${indexP}`,
                                                html: `<h4>${indexP} doit être une puissance de 2 (ex: 2, 4, 8, ...)</h4>`,
                                                icon: "warning",
                                              });

                                              handleChangeComponent(
                                                device.id,
                                                indexP,
                                                "capacity",
                                                null
                                              );
                                            }
                                          }}
                                        />
                                      </div>
                                    )}

                                    <div className="col-md-4">
                                      <label className="form-label">
                                        Options
                                      </label>
                                      <select
                                        className="form-select"
                                        value={c.options || ""}
                                        onChange={(e) =>
                                          handleChangeComponent(
                                            device.id,
                                            indexP,
                                            "options",
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="">
                                          -- Sélectionner --
                                        </option>
                                        {showOptions(device.type, indexP).map(
                                          (opt) => (
                                            <option key={opt} value={opt}>
                                              {opt}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>

                                    {isComponentOtherOptions(
                                      device.type,
                                      indexP
                                    ) && (
                                      <div className="col-md-4">
                                        <label className="form-label">
                                          Autres options
                                        </label>
                                        <select
                                          className="form-select"
                                          value={c.otherOptions || ""}
                                          onChange={(e) =>
                                            handleChangeComponent(
                                              device.id,
                                              indexP,
                                              "otherOptions",
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="">
                                            -- Sélectionner --
                                          </option>
                                          {showOtherOptions(
                                            device.type,
                                            indexP
                                          ).map((opt) => (
                                            <option key={opt} value={opt}>
                                              {opt}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="mt-3">
                                  <input
                                    type={
                                      showType(device.type, indexP) || "text"
                                    }
                                    className="form-control"
                                    placeholder={`Entrer ${indexP}`}
                                    value={c.value || ""}
                                    onChange={(e) =>
                                      handleChangeComponent(
                                        device.id,
                                        indexP,
                                        "value",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="d-flex justify-content-center align-items-center m-5">
                <div
                  className="btn btn-primary"
                  onClick={() =>
                    setInsertDevices((prev) => ({
                      ...prev,
                      devices: [
                        ...prev.devices,
                        {
                          newDevice,
                          id: prev.devices[prev.devices.length - 1].id + 1,
                        },
                      ],
                    }))
                  }
                >
                  + Ajouter un autre materiel
                </div>
              </div>
            </div>
          </div>

          {/* <div className="form-group">
            <label htmlFor="providerName">Nom du Fournisseur</label>
            <input
              type="text"
              className="form-control"
              value={newDevice.providerName}
              id="providerName"
              onChange={(e) =>
                setNewDevice({ ...newDevice, providerName: e.target.value })
              }
              required
            />
          </div> */}

          {/* <div className="form-group">
            <label htmlFor="labelFacture">Libellé du facture</label>
            <input
              type="text"
              className="form-control"
              value={newDevice.facture}
              id="labelFacture"
              onChange={(e) =>
                setNewDevice({ ...newDevice, facture: e.target.value })
              }
              required
            />
          </div> */}

          {/* <div className="form-group">
            <label htmlFor="purchaseDate">Date d'achat</label>
            <input
              required
              type="date"
              className="form-control"
              value={newDevice.purchase_date}
              id="purchaseDate"
              onChange={(e) =>
                setNewDevice({
                  ...newDevice,
                  purchase_date: e.target.value,
                  // warranty_end: new Date(newDevice.warranty_end)
                  //   .setFullYear(new Date(e.target.value).getFullYear() + 5)
                  //   .toString(),
                })
              }
            />
          </div> */}

          {/* <div className="form-group">
            <label htmlFor="pu">Prix Unitaire (PU) </label>
            <div className="d-flex justify-content-between">
              <input
                type="number"
                className="form-control"
                value={newDevice.current_value}
                id="pu"
                onChange={(e) =>
                  setNewDevice({
                    ...newDevice,
                    current_value: e.target.value,
                  })
                }
                required
              />
              <select
                className="form-control"
                value={newDevice.devises}
                onChange={(e) =>
                  setNewDevice({
                    ...newDevice,
                    devises: e.target.value,
                  })
                }
                required
              >
                <label htmlFor=""></label>
                <option value="">Sélectionner la devise</option>
                {devises.map((devise) => (
                  <option key={devise} value={devise}>
                    {devise}
                  </option>
                ))}
              </select>
            </div>
          </div> */}

          {/* <div className="form-group">
            <label htmlFor="quantity"> Quantité</label>

            <input
              type="number"
              className="form-control"
              value={newDevice.quantity}
              id="quantity"
              onChange={(e) =>
                setNewDevice({
                  ...newDevice,
                  quantity: e.target.value,
                })
              }
              required
            />
          </div> */}

          {/* <div className="form-group">
            <label>Fin de Garantie (5 ans par défaut)</label>
            <input
              type="date"
              className="form-control"
              value={newDevice.warranty_end || ""}
              onChange={(e) =>
                setNewDevice({ ...newDevice, warranty_end: e.target.value })
              }
            />
          </div> */}

          <div className="form-group mt-3 d-flex justify-content-end">
            <button className="btn btn-success" type="submit">
              Enregistrer
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

      {showPersonalForm && (
        <Modal
          isOpen={showPersonalForm}
          onRequestClose={() => setShowPersonalForm(false)}
        >
          <div className="container py-3">
            <div className="d-flex justify-content-between m-3">
              <h2 className="modal-title">Ajout d' un nouveau personnels</h2>
              <div
                className="btn btn-danger p-3"
                onClick={() => setShowPersonalForm(false)}
              >
                X
              </div>
            </div>

            <form onSubmit={handlePersonalFormSubmit} className="mb-3">
              <div className="d-flex justify-content-between">
                <div className="form-group ">
                  <label htmlFor="personnalName">Nom et Prénom:</label>
                  <input
                    required
                    type="text"
                    id="personnalName"
                    className="form-control"
                    value={personnals.newPersonal.userName || ""}
                    onChange={(e) =>
                      setPersonals((prev) => ({
                        ...prev,
                        newPersonal: {
                          ...prev.newPersonal,
                          userName: e.target.value,
                        },
                      }))
                    }
                  />
                </div>

                {personnals.newPersonal.userName && (
                  <div>
                    <label htmlFor={`${personnals.newPersonal.userCode}`}>
                      Matricule:
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id={`${personnals.newPersonal.userCode}`}
                      required
                      onChange={(e) =>
                        setPersonals((prev) => ({
                          ...prev,
                          newPersonal: {
                            ...prev.newPersonal,
                            userCode: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                )}
                <div className="form-group ">
                  <label htmlFor="function">Fonction:</label>
                  <input
                    required
                    type="text"
                    id="function"
                    className="form-control"
                    value={personnals.newPersonal.userFunction || ""}
                    onChange={(e) =>
                      setPersonals((prev) => ({
                        ...prev,
                        newPersonal: {
                          ...prev.newPersonal,
                          userFunction: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="form-group card p-3">
                <label htmlFor="direction">Direction:</label>
                <select
                  onChange={(e) =>
                    setPersonals((prev) => ({
                      ...prev,
                      newPersonal: {
                        ...prev.newPersonal,
                        userDirection: e.target.value,
                      },
                    }))
                  }
                  value={personnals.newPersonal.userDirection}
                  className="form-select"
                  required
                >
                  <option value="">Selectionner la direction</option>
                  <option value="Direction générale">Direction Générale</option>
                  <option value="Direction générale adjoint">
                    Direction générale adjoint
                  </option>
                  <option value="Direction administrative et finaciere">
                    Direction administrative et finaciere
                  </option>
                  <option value="Direction Technique et de l'amenagement">
                    Direction Technique et de l'amenagement
                  </option>
                  <option value="Direction Commerciale,Marketing et Management">
                    Direction Commerciale,Marketing et Management
                  </option>
                </select>
                {personnals.newPersonal.userDirection && (
                  <div>
                    <label
                      htmlFor={`${personnals.newPersonal.userDirectionCode}`}
                    >
                      Code:
                    </label>
                    <input
                      type="number"
                      value={personnals.newPersonal.userDirectionCode}
                      id={`${personnals.newPersonal.userDirectionCode}`}
                      required
                      onChange={(e) =>
                        setPersonals((prev) => ({
                          ...prev,
                          newPersonal: {
                            ...prev.newPersonal,
                            userDirectionCode: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="form-group card p-3">
                <label htmlFor="departement">Département:</label>
                <select
                  onChange={(e) =>
                    setPersonals((prev) => ({
                      ...prev,
                      newPersonal: {
                        ...prev.newPersonal,
                        userDepartment: e.target.value,
                      },
                    }))
                  }
                  value={personnals.newPersonal.userDepartment}
                  className="form-select"
                  required
                >
                  <option value="">Selectionner la departement</option>
                  <option value="Département direction générale">
                    Département direction Générale
                  </option>
                  <option value="Département direction générale adjoint">
                    Département direction générale adjoint
                  </option>
                  <option value="Département direction administrative et finaciere">
                    Département direction administrative et finaciere
                  </option>
                  <option value="Département direction Technique et de l'amenagement">
                    Département direction Technique et de l'amenagement
                  </option>
                  <option value="Département direction Commerciale,Marketing et Management">
                    Département direction Commerciale,Marketing et Management
                  </option>
                </select>
                {personnals.newPersonal.userDepartment && (
                  <div>
                    <label
                      htmlFor={`${personnals.newPersonal.userDepartmentCode}`}
                    >
                      Code:
                    </label>
                    <input
                      type="number"
                      id={`${personnals.newPersonal.userDepartmentCode}`}
                      value={personnals.newPersonal.userDepartmentCode}
                      required
                      onChange={(e) =>
                        setPersonals((prev) => ({
                          ...prev,
                          newPersonal: {
                            ...prev.newPersonal,
                            userDepartmentCode: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="form-group card p-3">
                <label htmlFor="service">Service:</label>
                <select
                  onChange={(e) =>
                    setPersonals((prev) => ({
                      ...prev,
                      newPersonal: {
                        ...prev.newPersonal,
                        userService: e.target.value,
                      },
                    }))
                  }
                  value={personnals.newPersonal.userService}
                  className="form-select"
                  required
                >
                  <option value="">Selectionner la service</option>
                  <option value="Département informatique">
                    Département informatique
                  </option>
                  <option value="Département Développement des partenariats">
                    Département Développement des partenariats
                  </option>
                  <option value="Département patrimoine">
                    Département patrimoine
                  </option>
                  <option value="Département juridique et contentieux">
                    Département juridique et contentieux
                  </option>
                </select>
                {personnals.newPersonal.userService && (
                  <div>
                    <label
                      htmlFor={`${personnals.newPersonal.userServiceCode}`}
                    >
                      Code:
                    </label>
                    <input
                      type="number"
                      id={`${personnals.newPersonal.userServiceCode}`}
                      required
                      onChange={(e) =>
                        setPersonals((prev) => ({
                          ...prev,
                          newPersonal: {
                            ...prev.newPersonal,
                            userServiceCode: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                )}
              </div>
              <div className="d-flex justify-content-center mt-4">
                <input
                  type="submit"
                  value="Enregistrer"
                  className="btn btn-success"
                />
              </div>
            </form>
          </div>
        </Modal>
      )}
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
                      .toLocaleDateString()
                      .split("T")[0]
                  }
                </h5>
                <h5>
                  <strong>Fin de garantie:</strong>
                  {
                    new Date(selectedDevice.warranty_end)
                      .toLocaleDateString()
                      .split("T")[0]
                  }
                </h5>
                <h5>
                  <strong>Fournisseur:</strong>
                  {selectedDevice.providerName || "Non mentionnée"}
                </h5>
                <h5>
                  <strong>Libellé du Facture:</strong>
                  {selectedDevice.facture || "Non mentionnée"}
                </h5>
                <h5>
                  <strong>Prix d'achat:</strong> {selectedDevice.current_value}{" "}
                  {selectedDevice.devises}
                </h5>
                <h5>
                  <strong>État de l'Amortissement:</strong>
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
                                  {value.capacity} {value.options}{" "}
                                  {value.otherOptions}
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
                      required
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
                      required
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
                      required
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
                      required
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
                        required
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
                        required
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
                  <div className="mb-3">
                    <label className="form-label">Nom du fournisseur:</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={selectedDevice.providerName}
                      onChange={(e) =>
                        setSelectedDevice({
                          ...selectedDevice,
                          providerName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Libellée du facture:</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={selectedDevice.facture}
                      onChange={(e) =>
                        setSelectedDevice({
                          ...selectedDevice,
                          facture: e.target.value,
                        })
                      }
                    />
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
                                required
                                className="form-control mb-2"
                                type={composant.type || "text"}
                                onBlur={() => {
                                  if (
                                    composant.name === "RAM" ||
                                    composant.name === "Stockage"
                                  ) {
                                    if (
                                      !isPowerOfTwo(
                                        selectedDevice.component[composant.name]
                                          .capacity
                                      )
                                    ) {
                                      setSelectedDevice((prev) => ({
                                        ...prev,
                                        component: {
                                          ...prev.component,
                                          [composant.name]: {
                                            ...prev.component[composant.name],
                                            capacity: null,
                                          },
                                        },
                                      }));

                                      selectedDevice.component[composant.name]
                                        .capacity &&
                                        Swal.fire({
                                          title: `Valeur invalide sur le ${composant.name}`,
                                          html: `<h4>${composant.name} doit etre toujours puissance de 2 </br>(ex:2,4,8,...) </h4>`,
                                          icon: "warning",
                                        });
                                    }
                                  }
                                }}
                                value={Math.abs(
                                  parseInt(
                                    selectedDevice.component[composant.name]
                                      ?.capacity
                                  )
                                )}
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
                            {composant.otherOptions && (
                              <select
                                className="form-select"
                                value={
                                  selectedDevice.component[composant.name]
                                    ?.otherOptions || ""
                                }
                                onChange={(e) =>
                                  setSelectedDevice((prev) => ({
                                    ...prev,
                                    component: {
                                      ...prev.component,
                                      [composant.name]: {
                                        ...prev.component[composant.name],
                                        otherOptions: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                required
                              >
                                <option value="">-- Sélectionner --</option>
                                {composant.otherOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}
                          </>
                        ) : (
                          <input
                            required
                            className="form-control"
                            type={composant.type || "text"}
                            placeholder={`Entrez ${composant.name}`}
                            value={
                              selectedDevice.component[composant.name]?.value ||
                              ""
                            }
                            onChange={(e) =>
                              setSelectedDevice((prev) => ({
                                ...prev,
                                component: {
                                  ...prev.component,
                                  [composant.name]: {
                                    ...(prev.component?.[composant.name] || {}),
                                    value: e.target.value,
                                  },
                                },
                              }))
                            }
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
                    <div className="d-flex">
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

                      <div
                        className="btn btn-secondary"
                        onClick={() =>
                          setUser({
                            ...user,
                            showPassword: !user.showPassword,
                          })
                        }
                      >
                        {!user.showPassword ? <FaEye /> : <FaEyeSlash />}
                      </div>
                    </div>
                    <div>
                      {!user.forgotedPassword ? (
                        <a
                          onClick={() =>
                            setUser((prev) => ({
                              ...prev,
                              forgotedPassword: true,
                            }))
                          }
                        >
                          Mots de passe oubliée ?{" "}
                        </a>
                      ) : (
                        <span></span>
                      )}
                    </div>
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
                      value={user.secondPassword}
                      onChange={(e) =>
                        setUser({ ...user, secondPassword: e.target.value })
                      }
                      className="form-control"
                      id="confirm-password"
                      required
                    />
                  </div>

                  <div className="mb-3 d-flex">
                    <input
                      value={user.code}
                      type="number"
                      className="form-control"
                      required
                      disabled={!isCodeSent || confirmedCode}
                      onChange={(e) =>
                        setUser({ ...user, code: e.target.value })
                      }
                    />
                    {!isCodeSent ? (
                      <div
                        className="btn btn-success"
                        onClick={handleConfirmEmail}
                      >
                        Envoyer le code
                      </div>
                    ) : !confirmedCode ? (
                      <div>
                        <div
                          className="btn btn-warning"
                          onClick={handleConfirmCode}
                        >
                          Verifier le code
                        </div>
                        <div
                          className="btn btn-primary"
                          onClick={handleConfirmEmail}
                        >
                          Reenvoyer le code
                        </div>
                      </div>
                    ) : (
                      <div className="bg-success p-2">
                        Code vérifiée
                        <FaCheck />
                      </div>
                    )}
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

      <div className="">
        <div
          className="d-flex justify-content-between align-items-center px-4 row"
          style={{ background: "whitesmoke", height: "70px" }}
        >
          <h5 className="mb-3 col-4 col-md-3">
            Site web développé par les développeurs de l'entreprise
          </h5>

          <h1 className="mb-3 col-8 col-md-6">SEIMAD MADAGASCAR SA</h1>

          <h5 className="mt-3 text-center">
            &copy; copyright {new Date().getFullYear()}
          </h5>
        </div>
      </div>
    </div>
  );
}
