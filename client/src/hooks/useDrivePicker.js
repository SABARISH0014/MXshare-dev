import { useEffect, useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

export const useDrivePicker = () => {
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);

  // 1. Load the Google Picker API script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('picker', () => setPickerApiLoaded(true));
    };
    document.body.appendChild(script);
  }, []);

  // 2. Function to open the Picker
  const openPicker = useCallback(({ clientId, developerKey, token, onSelect }) => {
    if (!pickerApiLoaded) return;

    const pickerCallback = (data) => {
      // --- GOOGLE DRIVE EVENTS ---
      // This handles the "Events" you asked for
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        // We extract only what we need
        const fileData = {
          fileId: doc.id,
          name: doc.name,
          mimeType: doc.mimeType,
          iconUrl: doc.iconUrl,
          url: doc.url,
          oauthToken: token, // Send user's token so backend can read the file
        };
        onSelect(fileData);
      } else if (data.action === window.google.picker.Action.CANCEL) {
        console.log('User cancelled picker');
      }
    };

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    view.setIncludeFolders(true);
    view.setSelectFolderEnabled(false); // We only want files

    const picker = new window.google.picker.PickerBuilder()
      .setDeveloperKey(developerKey)
      .setAppId(import.meta.env.VITE_GOOGLE_APP_ID)
      .setOAuthToken(token)
      .addView(view)
      .addView(new window.google.picker.DocsUploadView()) // Allows uploading directly inside picker
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  }, [pickerApiLoaded]);

  return { openPicker, pickerApiLoaded };
};