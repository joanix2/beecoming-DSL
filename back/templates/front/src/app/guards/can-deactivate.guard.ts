import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { CanDeactivate } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { CanDeactivateDialogComponent } from "../components/can-deactivate-dialog/can-deactivate-dialog.component";
import { ICanDeactivate } from "../interfaces/can-deactivate";

@Injectable({
  providedIn: "root",
})
export class CanDeactivateGuard implements CanDeactivate<ICanDeactivate> {
  constructor(private dialog: MatDialog) {}

  async canDeactivate(component: ICanDeactivate): Promise<boolean> {
    if (component.canDeactivate()) {
      return true;
    }

    const dialogRef = this.dialog.open(CanDeactivateDialogComponent, {
      width: "550px",
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    return result;
  }
}
