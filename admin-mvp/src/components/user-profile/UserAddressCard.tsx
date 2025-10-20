"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserAddressCard() {
  const { isOpen, closeModal } = useModal();
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  return (
    <>
      <div className="bg-white p-5 border border-gray-200 rounded-2xl lg:p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 lg:mb-6">
              Address
            </h4>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500">
                  Area/Locality
                </p>
                <p className="text-sm font-medium text-gray-800">
                  3rd Street, Koramangala
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500">
                  City/Postal Code
                </p>
                <p className="text-sm font-medium text-gray-800">
                  Bangalore, 560072
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7">
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500">
                    State
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    Karnataka
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500">
                    Country
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Address
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Area/locality</Label>
                  <Input type="text" defaultValue="3rd Street, Koramangala" />
                </div>

                <div>
                  <Label>City/Postal Code</Label>
                  <Input type="text" defaultValue="Bangalore, 560072" />
                </div>

                <div>
                  <Label>State</Label>
                  <Input type="text" defaultValue="Karnataka" />
                </div>

                <div>
                  <Label>Country</Label>
                  <Input type="text" defaultValue="India" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
