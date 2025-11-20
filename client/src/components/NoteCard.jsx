import React, { useContext } from 'react';
import { Star, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui/primitives';
import { ToastContext } from '../context/ToastContext';

const NoteCard = ({ note, onNavigate }) => {
    const { addToast } = useContext(ToastContext);
    const handleView = () => {
        addToast("Please log in to view this note.", "info");
        onNavigate('login');
    };

    return (
      <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-1 hover:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg h-14 line-clamp-2 text-white" title={note.title}>{note.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <p className="text-sm text-gray-400">
            Subject: <span className="font-medium text-gray-300">{note.subject}</span>
          </p>
          <div className="flex justify-between text-sm text-gray-300">
            <span className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" /> {note.rating}
            </span>
            <span className="flex items-center">
              <Download className="w-4 h-4 mr-1" /> {note.downloads}
            </span>
          </div>
        </CardContent>
        <div className="p-6 pt-0">
           <Button variant="outline" className="w-full" onClick={handleView}>
             View Note
           </Button>
        </div>
      </Card>
    );
};
export default NoteCard;