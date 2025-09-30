import { EmergencyContact } from "@/pages/Index";
import ContactCard from "./ContactCard";
import { Phone } from "lucide-react";

interface ContactListProps {
  emergencyType: string;
  userLocation: { lat: number; lng: number } | null;
}

const ContactList = ({ emergencyType, userLocation }: ContactListProps) => {
  // National Emergency Contacts (Philippines)
  const nationalContacts: EmergencyContact[] = [
    {
      id: "911",
      name: "Emergency Hotline 911",
      type: "all",
      phone: "911",
      isNational: true,
    },
    {
      id: "bfp",
      name: "Bureau of Fire Protection",
      type: "fire",
      phone: "(02) 8426-0219",
      isNational: true,
    },
    {
      id: "pnp",
      name: "Philippine National Police",
      type: "police",
      phone: "117",
      isNational: true,
    },
    {
      id: "redcross",
      name: "Philippine Red Cross",
      type: "medical",
      phone: "143",
      isNational: true,
    },
    {
      id: "ndrrmc",
      name: "NDRRMC",
      type: "disaster",
      phone: "(02) 8911-1406",
      isNational: true,
    },
    {
      id: "mmda",
      name: "MMDA",
      type: "accident",
      phone: "136",
      isNational: true,
    },
  ];

  // Local Emergency Contacts (simulated - would be based on actual location)
  const localContacts: EmergencyContact[] = [
    {
      id: "local-fire-1",
      name: "Metro Manila Fire Station",
      type: "fire",
      phone: "(02) 8426-0246",
      distance: "1.2 km",
    },
    {
      id: "local-police-1",
      name: "Police Station 5",
      type: "police",
      phone: "(02) 8721-0294",
      distance: "0.8 km",
    },
    {
      id: "local-hospital-1",
      name: "Manila Medical Center",
      type: "medical",
      phone: "(02) 8523-8131",
      distance: "2.1 km",
    },
    {
      id: "local-hospital-2",
      name: "Makati Medical Center",
      type: "medical",
      phone: "(02) 8888-8999",
      distance: "3.5 km",
    },
  ];

  // Filter contacts based on emergency type
  const filterContacts = (contacts: EmergencyContact[]) => {
    if (emergencyType === "other") return contacts;
    return contacts.filter(
      (contact) => contact.type === emergencyType || contact.type === "all"
    );
  };

  const filteredNational = filterContacts(nationalContacts);
  const filteredLocal = filterContacts(localContacts);

  return (
    <div className="space-y-6">
      {/* National Contacts */}
      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">National Emergency Contacts</h2>
        </div>
        <div className="space-y-3">
          {filteredNational.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </div>

      {/* Local Contacts */}
      {userLocation && filteredLocal.length > 0 && (
        <div className="bg-card rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">Nearby Emergency Services</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Services near your current location
          </p>
          <div className="space-y-3">
            {filteredLocal.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </div>
      )}

      {/* No Contacts Message */}
      {filteredNational.length === 0 && filteredLocal.length === 0 && (
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            No specific contacts found for this emergency type. Please call 911 for immediate
            assistance.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactList;
