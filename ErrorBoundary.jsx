import React, { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour afficher un fallback UI en cas d'erreur
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // Loguer l'erreur pour le suivi (par exemple, sur un serveur)
    console.error("Error caught by ErrorBoundary: ", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  static extractValues = (str) => {
    const extractedValues = (str.match(/\(([^)]+\/[^)]+)\)/g) || []) // Trouver "(USB/Wi-Fi)" et "(Ethernet/4G)"
      .flatMap((m) => m.slice(1, -1)); // Enlever les parenthèses et diviser par "/"

    return extractedValues;
  };

  render() {
    if (this.state.hasError) {
      // Retourner un UI de secours ou une page d'erreur
      return (
        <div>
          <h2>Oups, quelque chose s'est mal passé...</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          {this.state.errorInfo && this.state.errorInfo.componentStack}
          {this.state.errorInfo && (
            <details>
              {ErrorBoundary.extractValues(
                this.state.errorInfo.componentStack
              ).map((value) => (
                <a href={`${value}`}>{value}</a>
              ))}
            </details>
          )}
        </div>
      );
    }

    // Si aucune erreur n'est survenue, afficher les composants enfants normalement
    return this.props.children;
  }
}

export default ErrorBoundary;
