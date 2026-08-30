"use client";

import { createContext, ReactNode, useCallback, useContext, useState } from "react";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

interface PromptContextValue {
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
  message: (message: string, title?: string) => Promise<void>;
}

interface DialogState {
  isOpen: boolean;
  type: "confirm" | "prompt" | "message";
  title: string;
  message: string;
  defaultValue?: string;
  resolve: (value: any) => void;
}

const PromptContext = createContext<PromptContextValue | undefined>(undefined);

export function usePrompt() {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error("usePrompt must be used within a PromptProvider");
  }
  return context;
}

interface PromptProviderProps {
  children: ReactNode;
}

export function PromptProvider({ children }: PromptProviderProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: "message",
    title: "",
    message: "",
    resolve: () => {},
  });
  const [inputValue, setInputValue] = useState<string>("");

  const confirm = useCallback((message: string, title: string = "Confirm") => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        type: "confirm",
        title,
        message,
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((message: string, defaultValue: string = "", title: string = "Input Required") => {
    return new Promise<string | null>((resolve) => {
      setInputValue(defaultValue);
      setDialogState({
        isOpen: true,
        type: "prompt",
        title,
        message,
        defaultValue,
        resolve,
      });
    });
  }, []);

  const message = useCallback((message: string, title: string = "Message") => {
    return new Promise<void>((resolve) => {
      setDialogState({
        isOpen: true,
        type: "message",
        title,
        message,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    dialogState.resolve(true);
    setDialogState({ ...dialogState, isOpen: false });
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    if (dialogState.type === "confirm") {
      dialogState.resolve(false);
    } else if (dialogState.type === "prompt") {
      dialogState.resolve(null);
    } else {
      dialogState.resolve(undefined);
    }
    setDialogState({ ...dialogState, isOpen: false });
  }, [dialogState]);

  const handlePromptSubmit = useCallback(() => {
    dialogState.resolve(inputValue);
    setDialogState({ ...dialogState, isOpen: false });
  }, [dialogState, inputValue]);

  const handleMessageOk = useCallback(() => {
    dialogState.resolve(undefined);
    setDialogState({ ...dialogState, isOpen: false });
  }, [dialogState]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel],
  );

  return (
    <PromptContext.Provider value={{ confirm, prompt, message }}>
      {children}
      <Dialog open={dialogState.isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.title}</DialogTitle>
            <DialogDescription>{dialogState.message}</DialogDescription>
          </DialogHeader>

          {dialogState.type === "prompt" && (
            <div className={"space-y-2"}>
              <Label htmlFor={"prompt-input"}>Input</Label>
              <Input
                id={"prompt-input"}
                value={inputValue}
                onChange={handleInputChange}
                placeholder={"Enter your input..."}
                autoFocus
              />
            </div>
          )}

          <DialogFooter>
            {dialogState.type === "confirm" && (
              <>
                <Button variant={"outline"} onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm}>Confirm</Button>
              </>
            )}

            {dialogState.type === "prompt" && (
              <>
                <Button variant={"outline"} onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handlePromptSubmit}>Submit</Button>
              </>
            )}

            {dialogState.type === "message" && <Button onClick={handleMessageOk}>OK</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PromptContext.Provider>
  );
}
